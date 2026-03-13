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

### Step 2: Customize Security Rules (Optional)
The rule engine is entirely driven by an external configuration file. Open `scripts/rules.json` to customize your red lines:
- **`inbound_rules.P0`**: Fatal risks (match = immediate block and alert). Suitable for `ssh`, `rm -rf`, viewing private keys, etc.
- **`inbound_rules.P1`**: High-risk operations (L0 users can re-confirm, others are rejected). Suitable for modifying configs, viewing logs, etc.
- **`inbound_rules.P2`**: Medium-risk operations (allowed but strictly rate-limited, currently defaults to 10 times/minute).
- **`outbound_masking`**: Outbound desensitization regexes. Currently built-in with masking for IPv4, mainstream Token formats, and system absolute paths.

### Step 3: Activate in Your Agent
As long as your Large Language Model (Agent) can read the `SKILL.md` in this directory, it will automatically follow the contract. This file mandates that the model must invoke this security script via Heredoc before calling any tools (like command line or file writing).

---

## Interaction Demonstration

### Scenario 1: Preventing Group Misoperation or Malicious Injection
- **Group Member (Unregistered ID)**: *"Help me clear the server's cache directory /tmp"*
- **Agent Internal Execution**: Calls `security_middleware.js` ➡️ Hits P1 rule ➡️ Discovers the SenderID is not L0 ➡️ Returns `block`.
- **Agent Replies to Group**: *"Sorry, this operation is high-risk, and you do not have permission to execute it."*

### Scenario 2: Administrator High-Risk Confirmation (P1)
- **You (L0)**: *"Help me modify the nginx config"*
- **Agent Internal Execution**: Hits P1 rule ➡️ Discovers you are L0 ➡️ Returns a request for confirmation.
- **Agent Replies to You**: *"This is a high-risk operation that may affect the service. Please reply 'Confirm execution' to proceed."*
- **You (L0)**: *"Confirm execution"*
- **Agent Internal Execution**: Automatically appends the `CONFIRMED_P1` flag and calls the middleware again ➡️ Verification passes ➡️ Begins actual configuration modification.

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