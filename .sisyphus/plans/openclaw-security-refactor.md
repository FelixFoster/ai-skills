# Refactoring Plan: Policy Matrix Architecture (OpenClaw Security v2)

## Goal
Transform the security middleware from a hardcoded linear risk model (`P0/P1/P1_5/P2`) to a fully decoupled, semantic `Policy Matrix` using a `Default + Role Override` pattern.

## Architectural Changes
1.  **Rule Engine Decoupling**: Remove all `if (P1)` and `if (L0)` logic from `security_middleware.js`. The script will become a generic evaluation engine.
2.  **Semantic Naming**: Replace `P0` with names like `destroy_system_core`, and `P1_5` with `delete_standard_file`.
3.  **Role Overrides**: Implement JSON structures where actions can have a `default_rule` and specific `role_overrides` (e.g., L0 doesn't need confirmation, L1 does, L2 is blocked).
4.  **Priority Evaluation (Guardrail)**: If a command matches multiple policies (e.g., `rm -rf /` matches both `delete_standard_file` and `destroy_system_core`), the engine MUST evaluate them based on a defined strictness hierarchy or prioritize `block` over `allow`.

## Implementation Tasks

 [x] **Step 1. Design & Migrate to Semantic JSON schema**
  - [x] 重写 `skills/openclaw-security-middleware/scripts/rules.json`。创建 `policies` 根对象。
  - [x] 平移原 `P0` 正则到 `destroy_system_core` 策略中 (`default_rule: { action: block }`)。
  - [x] 平移原 `P1` 正则到 `modify_system_config` 策略中 (`default_rule: { action: block }`, `role_overrides: { L0: { action: allow, require_confirm: true } }`)。
  - [x] 提取 `rm\s+` 到 `delete_standard_file` 策略中 (`default_rule: { action: block }`, `role_overrides: { L1: { action: allow, require_confirm: true }, L0: { action: allow, require_confirm: false } }`)。
  - [x] 平移原 `P2` 正则到 `read_sensitive_data` 策略中，配置限流属性。
  - [x] *约束*: `outbound_masking` 保持原样不动。
 [x] **Step 2. Refactor Generic Evaluation Engine**
  - [x] 修改 `security_middleware.js`，移除原来硬编码的 P0/P1/P1_5/P2 的 `if` 分支块。
  - [x] 实现通用的迭代逻辑：遍历 `rules.policies`，找出所有正则匹配的策略。
  - [x] **冲突决议 (Conflict Resolution)**：如果匹配到多个策略（例如既匹配 `delete_standard_file` 又匹配 `destroy_system_core`），优先采用 `action: 'block'` 的策略。
  - [x] **角色覆盖解析**：读取当前用户的 Role。如果在 `role_overrides` 中有定义，则用 override 参数合并 `default_rule`；否则回退到 `default_rule`。
 [x] **Step 3. Implement Confirm & Rate-Limit Handlers**
  - [x] 如果最终解析出的配置是 `action: 'allow'` 且 `require_confirm: true`，抛出等待确认的返回指令（复用原确认逻辑的提示文本）。
  - [x] 将原来的 P2 限流逻辑泛化：如果策略对象包含 `rate_limit` 属性，则执行动态键名（以策略ID为键）的文件锁限流。
 [x] **Step 4. Update Documentation**
  - [x] 更新中英文 `README.md`，讲解最新的 `policies` 字典结构、`default_rule` 与 `role_overrides` 配置方法。
## Final Verification Wave
 [x] Execute tests simulating an L0 user bypassing confirmation for `rm test.txt`.
 [x] Execute tests simulating an L1 user being prompted for confirmation for `rm test.txt`.
 [x] Execute tests simulating an L2 user being blocked for `rm test.txt`.
 [x] Verify `rm -rf /` is globally blocked for all roles (L0/L1/L2).
 [x] Ensure Outbound masking remains functional.