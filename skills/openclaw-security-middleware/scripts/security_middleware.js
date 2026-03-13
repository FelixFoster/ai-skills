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
                        console.log(JSON.stringify({
                            action: 'block',
                            reason: 'P0 Critical Risk Detected',
                            request_id: request.request_id || 'unknown'
                        }));
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
                                console.log(JSON.stringify({
                                    action: 'block',
                                    reason: 'P1 High Risk Detected. L0 confirmation required. Please append "CONFIRMED_P1" to your request to proceed.',
                                    request_id: request.request_id || 'unknown'
                                }));
                                return;
                            }
                        } else {
                            console.log(JSON.stringify({
                                action: 'block',
                                reason: 'P1 High Risk Detected. Permission denied.',
                                request_id: request.request_id || 'unknown'
                            }));
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
                            console.log(JSON.stringify({
                                action: 'block',
                                reason: 'P2 Rate Limit Exceeded',
                                request_id: request.request_id || 'unknown'
                            }));
                            return;
                        }
                    }
                }
            }
        }
        console.log(JSON.stringify({
            action: 'pass',
            reason: 'Skeleton implementation - always pass',
            request_id: request.request_id || 'unknown'
        }));

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
