# OpenClaw Security Middleware Skill

> **简体中文**: [README.zh-CN.md](README.zh-CN.md)

This is an **enterprise-grade security policy middleware** designed for OpenClaw (and similar Agent frameworks). It acts as the last line of defense for your AI assistant by intercepting all potentially risky inbound commands and sanitizing outbound data.

## Core Features
- 🛡️ **Bidirectional Protection**: Intercepts malicious injections and dangerous commands (e.g., `rm -rf`), and automatically scrubs sensitive information (e.g., API Keys, IP addresses) from returned results.
- 👮 **RBAC Permission Tiering**: Distinguishes between Super Admins (L0) and Standard Users (L1/L2), thoroughly resolving the risk of the bot being "abused" in group chat environments.
- 🚥 **Intelligent Interception & Rate Limiting**: Directly rejects fatal operations, requires L0 confirmation for high-risk operations, and automatically rate-limits standard operations (anti-spam).
- 🔒 **Zero Dependencies & Concurrency Safe**: Written purely with built-in Node.js modules, cross-platform compatible (including file lock mechanisms), requiring no `npm install`.

---

## Quick Start Guide

### Step 1: Installation & Configuration
Copy this skill directory into your `skills/` folder.
Before using it, **you must configure the administrator list**, otherwise all high-risk operations will be rejected indiscriminately.

1. Open `config/auth_list.json`.
2. Fill in your real User ID (e.g., your Feishu/WeChat/Slack UserID) into the `users` array.
3. Set the role to `"L0"` (highest permission).

```json
{
  "users": [
    {
      "id": "your_real_UserID",
      "role": "L0",
      "name": "Admin"
    }
  ]
}
```

### Step 2: Customize Security Policies (Optional)
The security engine is driven by `scripts/rules.json` and uses a **Policy Matrix** architecture. You can define different policies based on your business needs and configure differentiated behaviors for different roles.

#### Policy Structure Explained
Each policy contains the following core fields:
- **`patterns`**: An array of regular expressions used to match dangerous commands.
- **`default_rule`**: The default rule, including `action` (`allow` or `block`), and optional `require_confirm` (whether confirmation is required) and `rate_limit` (number of allowed requests per minute).
- **`role_overrides`**: Role-specific override configurations. Allows customizing behavior for specific roles (e.g., `L0` admins), overriding the `default_rule`.
- **`outbound_masking`**: Outbound desensitization regexes. Currently built-in with masking for IPv4, mainstream Token formats, and system absolute paths.

#### Example Configuration
```json
"modify_system_config": {
  "patterns": ["passwd\\s+\\S+", "vim?\\s+/etc/\\S+"],
  "default_rule": { "action": "block" },
  "role_overrides": {
    "L0": { "action": "allow", "require_confirm": true }
  }
}
```
*The example above indicates that modifying system configurations is blocked by default, but L0 admins can execute it (requires secondary confirmation).*

### Appendix: Default Policies (rules.json) Explained

#### 1. Inbound (Intercepting Inputs) Analysis
* **`destroy_system_core` (Core Destruction)**:
  * Matches `ssh`, `rm -rf /`, reading private keys, etc.
  * **Default Behavior**: Absolute block (`block`). Prevents the LLM from being used as a jump server or performing catastrophic deletions.
* **`modify_system_config` (Configuration Tampering)**:
  * Matches `chmod`, `chown`, modifying passwords, editing `/etc/` files, etc.
  * **Default Behavior**: Blocked.
  * **Role Override**: `L0` admins are allowed to execute, but require secondary confirmation.
* **`delete_standard_file` (Standard Deletion)**:
  * Matches `rm `.
  * **Default Behavior**: Blocked. Prevents standard users from accidentally deleting files.
  * **Role Override**: `L1` developers are allowed to execute (requires confirmation), `L0` admins are allowed to execute (no confirmation required).
* **`read_sensitive_data` (Sensitive Reading)**:
  * Matches reading `/etc/passwd`, snooping in the root directory, global search for hidden files, etc.
  * **Default Behavior**: Allowed, but triggers a rate limit of 10 times per minute.

#### 2. Outbound (Data Masking)
This processes the final **chat text displayed to the user**.
**It does NOT affect the actual input/output of tools executed by the AI in the background, only the text in the dialog box.**
* **IP**: Replaces `192.168.1.1` with `***.***.*.***` to prevent exposing internal/external network architectures.
* **Token**: Replaces strings like `sk-xxxxx` (OpenAI, etc.), `AKLTxxx`, `eyJxxx` (JWT) with `[已隐藏的敏感密钥/Token]` to prevent account leaks.
* **Path**: Replaces the real username in absolute paths with `[user]`. For example, `/Users/fupeng/project/test.txt` becomes `/Users/[user]/project/test.txt`. This protects the host machine's privacy while allowing the user to know which directory the file was saved in.
  * *Note: This is solely for UI protection of the end-user. When the AI executes `bash` in the background, it still uses the real paths, and system operations are unaffected.*

### Step 3: Activate in Your Agent
As long as your Large Language Model (Agent) can read the `SKILL.md` in this directory, it will automatically follow the contract. This file mandates that the model must invoke this security script via Heredoc before calling any tools (like command line or file writing).

---

## Interaction Demonstration

### Scenario 1: Preventing Group Misoperation or Malicious Injection
- **Group Member (Unregistered ID)**: *"Help me clear the server's cache directory /tmp"*
- **Agent Internal Execution**: Calls `security_middleware.js` ➡️ Hits `modify_system_config` policy ➡️ Discovers the SenderID is not L0 ➡️ Returns `block`.
- **Agent Replies to Group**: *"Sorry, this operation is high-risk, and you do not have permission to execute it."*

### Scenario 2: Administrator High-Risk Confirmation (Confirmation Flow)
- **You (L0)**: *"Help me modify the nginx config"*
- **Agent Internal Execution**: Hits `modify_system_config` policy ➡️ Discovers you are L0 ➡️ Returns a request for confirmation.
- **Agent Replies to You**: *"This is a high-risk operation that may affect the service. Please reply 'Confirm execution' to proceed."*
- **You (L0)**: *"Confirm execution"*
- **Agent Internal Execution**: Automatically appends the `CONFIRMED` flag and calls the middleware again ➡️ Verification passes ➡️ Begins actual configuration modification.

### Scenario 3: Preventing Sensitive Data Leakage (Outbound)
- **You**: *"Help me look at the system's current environment variables"*
- **Agent Internal Execution**: Executes the `env` command and obtains long text containing real `sk-xxx...` keys.
- **Agent Internal Execution**: Before sending it to you, calls the middleware's `outbound` mode. The middleware automatically replaces the keys with `[已隐藏的敏感密钥/Token]`.
- **Agent Replies to You**: Safely desensitized text.

---

## Auditing and Troubleshooting
All requests (both intercepted and allowed) will be recorded in detail in `logs/audit.log` (JSON Lines format).
- The log file has a built-in rotation mechanism (default 10MB), so you don't need to worry about it filling up your hard drive.
- If the script encounters any unexpected crashes, it will automatically trigger the Fail-Safe mechanism, **defaulting to intercepting the current request**, and write the error stack trace to `logs/error.log`.