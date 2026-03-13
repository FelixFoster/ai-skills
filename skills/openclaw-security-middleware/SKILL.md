---
name: openclaw-security-middleware
description: Mandatory security layer for OpenClaw to intercept and validate inbound commands and outbound data.
version: 1.0.0
---

# OpenClaw Security Middleware

This skill is a mandatory pre-module for all OpenClaw operations. It acts as a security gateway that inspects every inbound command and every outbound response to prevent unauthorized actions and data leakage.

## Mandatory Usage Protocol

You MUST call this middleware before executing any potentially risky operation (file system changes, network requests, shell commands) and before final output delivery.

### Execution Contract

All interactions with the middleware MUST use the following bash pattern with a Heredoc to ensure JSON integrity and prevent shell escaping issues:

```bash
node skills/openclaw-security-middleware/scripts/security_middleware.js << 'EOF'
{
  "direction": "inbound",
  "sender_id": "user_id_here",
  "content": "the_command_or_data_to_validate"
}
EOF
```

### Parameters

- `direction`: Either `"inbound"` (for commands from the user) or `"outbound"` (for data being sent to the user).
- `sender_id`: The unique identifier of the user or process initiating the request.
- `content`: The actual payload to be inspected.

## Confirmation Flow

If the middleware detects a high-risk operation that requires confirmation, it will return a response indicating that user confirmation is required.

1. **Detection**: The middleware returns a block message.
2. **User Interaction**: You must present the risk to the user and ask for explicit confirmation.
3. **Re-submission**: If the user confirms, you must call the middleware again, appending `CONFIRMED` to the `content` field.

Example of confirmed re-submission:

```bash
node skills/openclaw-security-middleware/scripts/security_middleware.js << 'EOF'
{
  "direction": "inbound",
  "sender_id": "user_id_here",
  "content": "rm -rf /important/dir CONFIRMED"
}
EOF
```

## Compliance

Failure to use this middleware for risky operations is a violation of the security protocol. Always check the middleware output before proceeding with any action.
