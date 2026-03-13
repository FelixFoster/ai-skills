# Work Plan: OpenClaw Security Middleware Skill

## 目标
根据 `OpenClaw_Security_Skill_Prompt.md` 的架构设计，开发一个企业级安全防护技能 `openclaw-security-middleware`。该技能需要实现 LLM 工具调用前的强制本地拦截（入站过滤）与输出前的结果脱敏（出站清洗）。

## 核心架构设计

1.  **基于提示词的入口控制**：通过 `SKILL.md` 的强制指令，要求 LLM 在调用任意具有潜在风险的系统操作工具前，必须优先调用 `scripts/security_middleware.js`。
2.  **输入输出模式**：
    *   使用纯 **Node.js 环境**（消除 Python 环境依赖），通过 **标准输入 (stdin)** 接收 JSON 格式的负载数据。
    *   脚本向 **标准输出 (stdout)** 返回 JSON 格式的执行结果，指示 `action`。
3.  **状态管理与并发控制**：
    *   **P1 会话确认**：脚本无需实现复杂的异步回调。当检测到 P1 操作时，直接返回 `block` 并在 `reason` 中要求 LLM 向用户发起二次确认。如果是 L0 用户，LLM 可以在后续携带确认标识再次调用；若是 L1-L3 则直接拒绝。
    *   **P2 限流**：使用基于 Node.js 标准库 (`fs`) 构建的轻量级 JSON 文件存储时间戳，配合 `fs.openSync` 带 `'wx'` 标志（排他性创建）实现跨平台的原子文件锁，控制并发读写。
4.  **失效安全 (Fail-Safe)**：整个 `security_middleware.js` 包裹在顶层 `try...catch` 中。遇到任何异常，抛出 block。
5.  **审计日志 (Audit)**：使用 JSONL 格式追加写入 `logs/audit.log`，使用 Node.js `fs` 模块实现日志大小检查。

## 文件树规划
```
skills/openclaw-security-middleware/
├── SKILL.md                          # 技能描述与拦截机制系统提示词
├── scripts/
│   ├── security_middleware.js        # 核心拦截与脱敏逻辑 (Node.js)
│   └── rules.json                    # 将正则规则从代码中抽离，方便维护
├── config/
│   └── auth_list.json                # RBAC L0/L1 授权名单模板
└── logs/                             # 运行时动态生成，无需提前建立，仅需确保父目录存在
    └── audit.log
```

## 实施任务列表

 [x] **Step 1. Initialize Directories & Configurations**
  - [x] 创建目录：`skills/openclaw-security-middleware/{scripts,config,logs}`
  - [x] 编写 `config/auth_list.json`：包含 L0 和 L1 角色的 JSON 数组/对象模板。
  - [x] 编写 `scripts/rules.json`：将 P0/P1/P2 正则表达式，以及出站脱敏正则（IP/Token/Path）提取为外部配置文件。
 [x] **Step 2. Implement Middleware Core Logic**
  - [x] 编写 `scripts/security_middleware.js` 骨架：使用 `readline` 模块接收标准输入 JSON。
  - [x] 确保使用 `fs.openSync(path, 'wx')` 实现跨平台兼容的并发文件锁，替换原计划中局限的 `fcntl`。
  - [x] 在脚本顶部强制绑定 `process.stdin` 和 `process.stdout` 的编码为 `utf8`。
  - [x] 实现顶层全局 `try...except Exception` 兜底，发生任何错误直接打印 `{"action": "block", ...}`。
  - [x] 实现 JSON 文件和正则库 `rules.json` 的安全加载。
  - [x] 全局异常捕获发生时，先将具体的 `traceback` 堆栈写入 `logs/error.log`（以追加模式），然后再向 `stdout` 输出通用的 block 指令。
 [x] **Step 3. Implement RBAC & Inbound Controls**
  - [x] 实现 `auth_list.json` 读取及 L0/L1/L2 鉴权逻辑。
  - [x] 循环正则匹配 P0 级风险：匹配即返回 `block` 报警。
  - [x] 循环正则匹配 P1 级风险：匹配时校验权限。L0 用户返回 `block` 但需提示要求确认；L1以下直接 `block` 拒绝。
  - [x] 循环正则匹配 P2 级风险：实现基于 JSON 文件持久化（使用 `fcntl` 文件锁，确保并发安全）的简易速率限制。
 [x] **Step 4. Implement Outbound Data Masking**
  - [x] 针对出站数据：应用配置好的脱敏正则（IP 替换、Token 隐藏、路径抹除）。
  - [x] 返回 `{"action": "pass", "sanitized_text": "..."}`。
 [x] **Step 5. Implement Audit Logging**
  - [x] 编写审计日志函数，带并发文件锁（使用 `fs` 的排他性写入）。
  - [x] 实现日志大小检查与滚动机制（例如超过 10MB 时重命名为 `audit.1.log`）。
  - [x] 在 `pass` 和 `block` 的最终返回前，统一写入 `logs/audit.log`（JSON Lines 格式）。
 [x] **Step 6. Write SKILL.md Prompt Integration**
  - [x] 编写 `SKILL.md`，定义此技能为 OpenClaw 的必须前置模块。
  - [x] 在提示词中**硬性规定**交互契约：必须通过 `node security_middleware.js << 'EOF'` 方式调用，使用 Heredoc 传输 JSON。
  - [x] 补充针对 P1 二次确认时的回复流程说明。
## Final Verification Wave
 [x] 确保所有文件位于 `skills/openclaw-security-middleware` 目录下。
  - [x] 提示词必须修改调用方式为 **Heredoc** 以防单引号逃逸：`node security_middleware.js << 'EOF'`。
  - [x] 确保 `security_middleware.js` 无任何第三方 `npm` 依赖（不使用 package.json）。
  - [x] 测试执行 `node scripts/security_middleware.js` 输入合法/非法 JSON 以验证输出和容错。