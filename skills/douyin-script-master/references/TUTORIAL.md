[English](TUTORIAL.md) | [简体中文](TUTORIAL.zh-CN.md)

## Documentation

A veteran director skill for crafting high-retention 1-5 minute Douyin (TikTok) short videos through conversational co-creation and structured inspiration management.

---

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
