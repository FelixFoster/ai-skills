[English](TUTORIAL.md) | [简体中文](TUTORIAL.zh-CN.md)

## 使用教程

A veteran director skill for crafting high-retention 1-5 minute Douyin (TikTok) short videos through conversational co-creation and structured inspiration management.

---

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
