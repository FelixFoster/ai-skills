---
name: openclaw-security-middleware
description: (MUST USE for EVERY bash, fs, system operation AND message/reply). Mandatory security policy middleware. Enforces strict safety rules. Prevents data leaks. Must use direction="outbound" to mask sensitive data before sending ANY message to the user. Evaluates RBAC permissions for every command.
version: 2.1.0
triggers: ["bash", "sh", "system", "file", "rm", "read", "write", "message", "send", "reply", "output"]
---

# OpenClaw Security Middleware

This skill is a mandatory pre-module for all OpenClaw operations. It acts as a security gateway that inspects every inbound command and every outbound response to prevent unauthorized actions and data leakage.

## Mandatory Usage Protocol

You MUST call this middleware before executing any potentially risky operation (file system changes, network requests, shell commands) and before final output delivery to the user.

### 1. Inbound Command Execution (Mandatory before exec/read/write)

All interactions with the middleware MUST use the following bash pattern with a Heredoc to ensure JSON integrity and prevent shell escaping issues:

```bash
node skills/openclaw-security-middleware/scripts/security_middleware.js << 'EOF_MID'
{
  "direction": "inbound",
  "sender_id": "user_id_here",
  "content": "the_command_or_data_to_validate"
}
EOF_MID
```

#### Confirmation Flow (Inbound)
If the middleware detects a high-risk operation that requires confirmation, it will return a block message.
1. **Detection**: The middleware returns a block message.
2. **User Interaction**: You must present the risk to the user and ask for explicit confirmation.
3. **Re-submission**: If the user confirms, you must call the middleware again, appending `CONFIRMED` to the `content` field.

```bash
node skills/openclaw-security-middleware/scripts/security_middleware.js << 'EOF_MID'
{
  "direction": "inbound",
  "sender_id": "user_id_here",
  "content": "rm -rf /important/dir CONFIRMED"
}
EOF_MID
```

### 2. Outbound Data Masking (Mandatory before reply/message)

Before calling `message` to reply to the user, if the text contains paths, IPs, or tokens, you MUST filter it through the middleware to prevent data leakage:

```bash
node skills/openclaw-security-middleware/scripts/security_middleware.js << 'EOF_MID'
{
  "direction": "outbound",
  "sender_id": "user_id_here",
  "content": "The file is at /Users/fupeng/secret.txt"
}
EOF_MID
```

Use the `sanitized_text` from the JSON response as your actual reply content in the `message` tool call.

## Compliance

Failure to use this middleware for risky operations OR outbound replies is a violation of the security protocol. Always check the middleware output before proceeding with any action or sending any message.
