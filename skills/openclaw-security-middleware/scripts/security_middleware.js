const fs = require('fs');
const path = require('path');
const readline = require('readline');


process.stdin.setEncoding('utf8');

if (process.stdout.setDefaultEncoding) {
    process.stdout.setDefaultEncoding('utf8');
}

const LOG_FILE = path.join(__dirname, '../logs/error.log');
const RULES_FILE = path.join(__dirname, 'rules.json');
const AUTH_LIST_FILE = path.join(__dirname, '../config/auth_list.json');
const AUDIT_LOG_FILE = path.join(__dirname, '../logs/audit.log');
const AUDIT_LOCK_FILE = path.join(__dirname, '../logs/audit.lock');
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Simple file-based lock for cross-platform concurrency control.
 * @param {string} lockPath Path to the lock file.
 * @param {Function} callback Function to execute while holding the lock.
 * @param {number} retries Number of retries if lock is held.
 */
async function withFileLock(lockPath, callback, retries = 10) {
    let fd;
    let currentTry = 0;

    while (currentTry < retries) {
        try {
            // 'wx' flag ensures atomic creation for locking
            fd = fs.openSync(lockPath, 'wx');
            break;
        } catch (err) {
            if (err.code === 'EEXIST') {
                currentTry++;
                if (currentTry >= retries) {
                    throw new Error(`Could not acquire lock on ${lockPath} after ${retries} attempts`);
                }

                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                throw err;
            }
        }
    }

    try {
        return await callback();
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        }
        try {
            fs.unlinkSync(lockPath);
        } catch (err) {

        }
    }
}

/**
 * Logs an audit entry with file locking and rotation.
 * @param {Object} request The original request object.
 * @param {Object} result The result of the security check.
 */
async function logAudit(request, result) {
    await withFileLock(AUDIT_LOCK_FILE, async () => {
        if (fs.existsSync(AUDIT_LOG_FILE)) {
            const stats = fs.statSync(AUDIT_LOG_FILE);
            if (stats.size > MAX_LOG_SIZE) {
                const backupPath = path.join(__dirname, '../logs/audit.1.log');
                if (fs.existsSync(backupPath)) {
                    fs.unlinkSync(backupPath);
                }
                fs.renameSync(AUDIT_LOG_FILE, backupPath);
            }
        }
        const logEntry = JSON.stringify({
            timestamp: new Date().toISOString(),
            request,
            result
        }) + '\n';
        fs.appendFileSync(AUDIT_LOG_FILE, logEntry, 'utf8');
    });
}

/**
 * Main processing logic.
 */
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        terminal: false
    });

    let inputData = '';

    for await (const line of rl) {
        inputData += line;
    }

    if (!inputData.trim()) {
        return;
    }

    try {
        const request = JSON.parse(inputData);
        

        const rules = JSON.parse(fs.readFileSync(RULES_FILE, 'utf8'));
        const authList = JSON.parse(fs.readFileSync(AUTH_LIST_FILE, 'utf8'));


        if (request.direction === 'inbound') {
            // Determine role
            let role = 'L2';
            if (authList.users) {
                const user = authList.users.find(u => u.id === request.sender_id);
                if (user && user.role) {
                    role = user.role;
                }
            }

            // Check P0
            if (rules.inbound_rules && rules.inbound_rules.P0) {
                for (const rule of rules.inbound_rules.P0) {
                    if (new RegExp(rule).test(request.content)) {
                        const result = {
                            action: 'block',
                            reason: 'P0 Critical Risk Detected',
                            request_id: request.request_id || 'unknown'
                        };
                        await logAudit(request, result);
                        console.log(JSON.stringify(result));
                        return;
                    }
                }
            }
            // Check P1
            if (rules.inbound_rules && rules.inbound_rules.P1) {
                for (const rule of rules.inbound_rules.P1) {
                    if (new RegExp(rule).test(request.content)) {
                        if (role === 'L0') {
                            if (!request.content.includes('CONFIRMED_P1')) {
                                const result = {
                                    action: 'block',
                                    reason: 'P1 High Risk Detected. L0 confirmation required. Please append "CONFIRMED_P1" to your request to proceed.',
                                    request_id: request.request_id || 'unknown'
                                };
                                await logAudit(request, result);
                                console.log(JSON.stringify(result));
                                return;
                            }
                        } else {
                            const result = {
                                action: 'block',
                                reason: 'P1 High Risk Detected. Permission denied.',
                                request_id: request.request_id || 'unknown'
                            };
                            await logAudit(request, result);
                            console.log(JSON.stringify(result));
                            return;
                        }
                    }
                }
            }
            // Check P2
            if (rules.inbound_rules && rules.inbound_rules.P2) {
                for (const rule of rules.inbound_rules.P2) {
                    if (new RegExp(rule).test(request.content)) {
                        const lockPath = path.join(__dirname, '../logs/rate_limit.lock');
                        const dataPath = path.join(__dirname, '../logs/rate_limit.json');
                        const isBlocked = await withFileLock(lockPath, async () => {
                            let data = {};
                            try {
                                if (fs.existsSync(dataPath)) {
                                    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
                                }
                            } catch (e) {
                                // Ignore read errors, start fresh
                            }
                            const now = Date.now();
                            const oneMinuteAgo = now - 60000;
                            // Clean up old timestamps
                            let timestamps = data.timestamps || [];
                            timestamps = timestamps.filter(ts => ts > oneMinuteAgo);
                            if (timestamps.length >= 10) {
                                return true; // Blocked
                            }
                            timestamps.push(now);
                            data.timestamps = timestamps;
                            fs.writeFileSync(dataPath, JSON.stringify(data), 'utf8');
                            return false; // Not blocked
                        });
                        if (isBlocked) {
                            const result = {
                                action: 'block',
                                reason: 'P2 Rate Limit Exceeded',
                                request_id: request.request_id || 'unknown'
                            };
                            await logAudit(request, result);
                            console.log(JSON.stringify(result));
                            return;
                        }
                    }
                }
            }
        }
        else if (request.direction === 'outbound') {
            let sanitizedText = request.content || '';
            if (rules.outbound_masking) {
                for (const key of Object.keys(rules.outbound_masking)) {
                    const regexString = rules.outbound_masking[key];
                    const regex = new RegExp(regexString, 'g');
                    let replacement = '';
                    if (key === 'IP') {
                        replacement = '***.***.*.***';
                    } else if (key === 'Token') {
                        replacement = '[已隐藏的敏感密钥/Token]';
                    } else if (key === 'Path') {
                        replacement = '$1[user]$3';
                    }
                    sanitizedText = sanitizedText.replace(regex, replacement);
                }
            }
            const result = {
                action: 'pass',
                sanitized_text: sanitizedText,
                request_id: request.request_id || 'unknown'
            };
            await logAudit(request, result);
            console.log(JSON.stringify(result));
            return;
        }
        const result = {
            action: 'pass',
            reason: 'Inbound request passed security checks',
            request_id: request.request_id || 'unknown'
        };
        await logAudit(request, result);
        console.log(JSON.stringify(result));

    } catch (err) {

        throw err;
    }
}


(async () => {
    try {
        await main();
    } catch (error) {

        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ERROR: ${error.stack}\n`;
        
        try {
            fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
        } catch (logErr) {

        }


        console.log(JSON.stringify({
            action: 'block',
            reason: 'Internal Error - Fail Safe Triggered'
        }));
        process.exit(0);
    }
})();
