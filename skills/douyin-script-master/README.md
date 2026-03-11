# Douyin Script Master | 抖音剧本大师

A veteran director skill for crafting high-retention 1-5 minute Douyin (TikTok) short videos through conversational co-creation and structured inspiration management.

---

## English Version

### Installation
To use this skill, clone or copy the `douyin-script-master` directory into your `skills/` folder:
```bash
cp -r path/to/douyin-script-master your-project/skills/
```

### Inspiration Workflow
Capture raw ideas before they vanish.
- **Trigger**: Use the `/inspire` command or natural language like "Save this idea" or "记个灵感".
- **Process**: The AI expands your raw idea into 3 distinct creative angles or hooks.
- **Storage**: Inspirations are saved to `data/inspirations/` and indexed in `index/inspiration_index.md`.

### Co-creation Workflow
The AI acts as your director, not just a writer.
- **Chat-First**: All brainstorming, drafting, and iterations happen directly in the chat UI.
- **No Premature Saving**: The AI will **NOT** write scripts to files until you explicitly say "save" or "定稿" (finalize).
- **Focus**: High-retention hooks, visual storytelling, and viral mechanics.

### Shadow Logging
The AI learns your style silently.
- **How it works**: When you correct the AI (e.g., "too formal", "make it punchier"), it silently logs these preferences in `learnings/STYLE_CORRECTIONS.md`.
- **Benefit**: You don't need to repeat yourself; the AI adapts to your voice over time.

### Critic Usage
Summon a specialist to tear apart your draft.
- **Trigger**: Use `/critic [type]` or natural language like "找个茬" or "Critique this".
- **Types**:
  - `Data Hacker`: Focuses on the 3-second hook and retention metrics.
  - `Emotion Manipulator`: Focuses on empathy and the emotional arc.
  - `Minimalist`: Focuses on cutting fluff and tightening pacing.
- **Rule**: The critic provides feedback but won't rewrite until you give the green light.

### Evolution Process
Turn temporary corrections into permanent rules.
- **Trigger**: Use `/publish` or say "发视频了复盘一下" (I published it, let's review).
- **Process**: The AI reviews `STYLE_CORRECTIONS.md`, moves frequent/important rules to `user_preferences.md`, and archives the finalized script to `data/published/`.

### Examples
- **Inspiration**: `/inspire A story about a cat who thinks it's a dog.`
- **Critic**: `/critic Data Hacker` or "让毒舌总监看看这个钩子"
- **Finalizing**: "这个版本不错，定稿吧。"
- **Review**: `/publish` or "视频发了，复盘一下。"

---

## 中文版

### 安装
将 `douyin-script-master` 目录克隆或复制到你的 `skills/` 文件夹中：
```bash
cp -r path/to/douyin-script-master your-project/skills/
```

### 灵感捕手工作流
在灵感消失前抓住它。
- **触发**: 使用 `/inspire` 命令或自然语言，如“记个灵感”或“保存这个想法”。
- **过程**: AI 会将你的原始想法扩展为 3 个不同的创意角度或钩子。
- **存储**: 灵感保存在 `data/inspirations/` 中，并在 `index/inspiration_index.md` 中索引。

### 对话式共创工作流
AI 是你的导演，而不只是打字员。
- **对话优先**: 所有的头脑风暴、草拟和迭代都直接在聊天界面中进行。
- **禁止提前保存**: 在你明确说“保存”或“定稿”之前，AI **不会**将剧本写入文件。
- **核心**: 关注高留存钩子、视觉叙事和爆火机制。

### 影子日志 (Shadow Logging)
AI 会默默学习你的风格。
- **原理**: 当你纠正 AI 时（例如“太正式了”、“再简练点”），它会默默地将这些偏好记录在 `learnings/STYLE_CORRECTIONS.md` 中。
- **好处**: 你不需要重复自己；AI 会随着时间的推移适应你的语调。

### 毒舌总监 (Critic)
召唤专家来拆解你的草案。
- **触发**: 使用 `/critic [类型]` 或自然语言，如“找个茬”或“让毒舌总监看看”。
- **类型**:
  - `Data Hacker` (数据黑客): 专注于 3 秒钩子和留存指标。
  - `Emotion Manipulator` (情绪大师): 专注于共情和情感曲线。
  - `Minimalist` (极简主义者): 专注于删减废话和紧凑节奏。
- **规则**: 评论家只提供反馈，除非你点头，否则不会自动重写。

### 自我进化工作流
将临时修正转化为永久规则。
- **触发**: 使用 `/publish` 或说“发视频了复盘一下”。
- **过程**: AI 审查 `STYLE_CORRECTIONS.md`，将频繁/重要的规则移至 `user_preferences.md`，并将定稿剧本归档到 `data/published/`。

### 示例
- **灵感**: `/inspire 一个认为自己是狗的猫的故事。`
- **评论**: `/critic Data Hacker` 或 “让毒舌总监看看这个钩子”
- **定稿**: “这个版本不错，定稿吧。”
- **复盘**: `/publish` 或 “视频发了，复盘一下。”
