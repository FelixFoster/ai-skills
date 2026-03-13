# OpenClaw Security Middleware Skill

> **English Version**: [README.en.md](README.en.md)

这是一个为 OpenClaw（及类似 Agent 框架）设计的**企业级安全策略中间件**。它通过拦截所有具有潜在风险的入站命令（Inbound）并清洗出站数据（Outbound），为你的 AI 助手提供最后一道防线。

## 核心特性
- 🛡️ **双向防护**：拦截恶意注入与危险命令（如 `rm -rf`），自动抹除返回结果中的敏感信息（如 API Key、IP 地址）。
- 👮 **RBAC 权限分级**：区分超级管理员（L0）与普通用户（L1/L2），彻底解决群聊环境下机器人被“滥用”的风险。
- 🚥 **智能拦截与限流**：致命操作直接拒绝，高危操作需 L0 确认，普通操作自动频率限制（防刷）。
- 🔒 **零依赖与并发安全**：采用纯 Node.js 内置模块编写，跨平台兼容（含文件锁机制），无需 `npm install`。

---

## 快速上手指南

### 步骤 1：安装与配置
将本技能目录拷贝到你的 `skills/` 文件夹下。
在使用前，**你必须配置管理员名单**，否则所有高危操作都会被无差别拒绝。

1. 打开 `config/auth_list.json`。
2. 将你的真实用户 ID（如飞书/微信/Slack 的 UserID）填入 `users` 数组中。
3. 将角色设置为 `"L0"`（最高权限）。

```json
{
  "users": [
    {
      "id": "你的真实_UserID",
      "role": "L0",
      "name": "Admin"
    }
  ]
}
```

### 步骤 2：自定义安全策略（可选）
安全引擎由 `scripts/rules.json` 驱动，采用 **Policy Matrix（策略矩阵）** 架构。你可以根据业务需求定义不同的策略（Policy），并为不同角色配置差异化的行为。

#### 策略结构解析
每个策略包含以下核心字段：
- **`patterns`**: 正则表达式数组，用于匹配危险命令。
- **`default_rule`**: 默认规则，包含 `action` (`allow` 或 `block`)，以及可选的 `require_confirm` (是否需要确认) 和 `rate_limit` (每分钟限流次数)。
- **`role_overrides`**: 角色覆盖配置。允许为特定角色（如 `L0` 管理员）定制行为，覆盖 `default_rule`。
- **`outbound_masking`**：出站脱敏正则。目前已内置 IPv4、主流 Token 格式、系统绝对路径的打码清洗。

#### 示例配置
```json
"modify_system_config": {
  "patterns": ["passwd\\s+\\S+", "vim?\\s+/etc/\\S+"],
  "default_rule": { "action": "block" },
  "role_overrides": {
    "L0": { "action": "allow", "require_confirm": true }
  }
}
```
*上例表示：修改系统配置的操作默认被拦截，但 L0 管理员可以执行（需二次确认）。*

### 附录：默认策略 (rules.json) 解析

#### 1. Inbound (入站拦截)分析
* **`destroy_system_core` (核心破坏)**：
  * 匹配 `ssh`, `rm -rf /`, 读取私钥等。
  * **默认行为**：绝对拦截 (`block`)。防止 LLM 作为跳板机或执行灾难性删除。
* **`modify_system_config` (配置篡改)**：
  * 匹配 `chmod`, `chown`, 修改密码, 编辑 `/etc/` 文件等。
  * **默认行为**：拦截。
  * **角色覆盖**：`L0` 管理员允许执行，但需二次确认。
* **`delete_standard_file` (普通删除)**：
  * 匹配 `rm `。
  * **默认行为**：拦截。防止普通用户误删文件。
  * **角色覆盖**：`L1` 开发者允许执行（需确认），`L0` 管理员允许执行（无需确认）。
* **`read_sensitive_data` (敏感读取)**：
  * 匹配读取 `/etc/passwd`, 窥探 root 目录, 全局搜索隐藏文件等。
  * **默认行为**：允许执行，但触发每分钟 10 次的频率限制。

#### 2. Outbound (出站清洗)
这是对 AI 最终**显示给用户的聊天文本**进行马赛克处理。
**它不会影响 AI 后台实际执行工具的输入输出，仅影响对话框里的文字。**
* **IP**：将 `192.168.1.1` 替换为 `***.***.*.***`，防内/外网架构暴露。
* **Token**：将形如 `sk-xxxxx` (OpenAI等), `AKLTxxx`, `eyJxxx` (JWT) 替换为 `[已隐藏的敏感密钥/Token]`，防账号泄露。
* **Path**：将带有真实用户名的绝对路径中的用户名替换为 `[user]`。例如将 `/Users/fupeng/project/test.txt` 替换为 `/Users/[user]/project/test.txt`。这样既保护了宿主机的隐私用户名，又能让用户清楚知道文件被存在了哪个目录下。
  * *注：这仅是对终端用户的 UI 保护。AI 底层执行 `bash` 时拿到的依然是真实路径，系统运行不受影响。*

### 步骤 3：在你的 Agent 中激活
只要你的大语言模型（Agent）能读取到本目录下的 `SKILL.md`，它就会自动遵循契约。该文件已强制规定了模型必须在调用任何工具（如命令行、文件写入）前，优先通过 Heredoc 方式调用本安全脚本。

---

## 交互演示

### 场景一：防止群内误操作或恶意注入
- **群友（未登记ID）**：`“帮我清空一下服务器的缓存目录 /tmp”`
- **Agent 内部执行**：调用 `security_middleware.js` ➡️ 命中 `modify_system_config` 策略 ➡️ 发现该 SenderID 不是 L0 ➡️ 返回 `block`。
- **Agent 回复群里**：`“抱歉，该操作属于高危操作，您没有执行权限。”`

### 场景二：管理员的高危确认 (Confirmation Flow)
- **你（L0）**：`“帮我修改一下 nginx 的配置”`
- **Agent 内部执行**：命中 `modify_system_config` 策略 ➡️ 发现你是 L0 ➡️ 返回要求确认。
- **Agent 回复你**：`“这是一个高危操作，可能会影响服务。请回复‘确认执行’以继续。”`
- **你（L0）**：`“确认执行”`
- **Agent 内部执行**：自动附加 `CONFIRMED` 标识再次调用中间件 ➡️ 验证通过 ➡️ 开始实际修改配置。

### 场景三：防止敏感数据外泄（Outbound）
- **你**：`“帮我看一下系统现在的环境变量”`
- **Agent 内部执行**：执行了 `env` 命令，获取到了包含真实 `sk-xxx...` 密钥的长文本。
- **Agent 内部执行**：在发给你之前，调用中间件的 `outbound` 模式。中间件自动将密钥替换为 `[已隐藏的敏感密钥/Token]`。
- **Agent 回复你**：安全脱敏后的文本。

---

## 审计与故障排查
所有的请求（包含被拦截和放行的）都会被详细记录到 `logs/audit.log` 中（JSON Lines 格式）。
- 日志文件自带滚动机制（默认 10MB），不用担心撑爆硬盘。
- 如果脚本运行出现任何意外崩溃，会自动触发 Fail-Safe（失效安全）机制，**默认拦截当前请求**，并将错误堆栈写入 `logs/error.log`。