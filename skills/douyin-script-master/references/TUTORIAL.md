[English](TUTORIAL.md) | [简体中文](TUTORIAL.zh-CN.md)

## Documentation

A veteran 口播 (talking-head) director skill for crafting high-retention 30s-5min Douyin (TikTok) short videos through conversational co-creation and structured inspiration management.

---

### Installation
To use this skill, clone or copy the `douyin-script-master` directory into your `skills/` folder:
```bash
cp -r path/to/douyin-script-master your-project/skills/
```

### Quick Reference: Commands

| Command | Alias | Description |
| :--- | :--- | :--- |
| `/brainstorm` | `帮我盘一下` | Deep-Dive mode: 2 sharp questions before drafting |
| `/revise` | `帮我改改` | Revision mode: targeted fixes on an existing script |
| `/critic [type]` | `找个茬` | Summon a critic persona (types: `data`, `emotion`, `minimal`, or default Doom-Scroller) |
| `/inspire` | `记个灵感` | Capture and expand a raw idea |
| `/save` | `定稿` | Save the current draft to `data/drafts/` |
| `/publish` | `发视频了` | Trigger Self-Evolver: archive + learn preferences |
| `/preferences` | `看看偏好` | Display currently learned style rules |

### Inspiration Workflow
Capture raw ideas before they vanish.
- **Trigger**: Use `/inspire` or natural language like "Save this idea" or "记个灵感".
- **Process**: The AI expands your raw idea into 3 distinct creative angles or hooks.
- **Storage**: Inspirations are saved to `data/inspirations/` and indexed in `index/inspiration_index.md`.

### Triple-Track Co-creation
The AI acts as your director, not just a writer, using three distinct tracks:
- **Fast-Track (Default)**: Immediately outputs a full 4-column matrix for rapid execution. No questions asked.
- **Deep-Dive** (`/brainstorm`): The AI asks 2 sharp questions to uncover the "soul" of the video before drafting.
- **Revision Mode** (`/revise`): Paste an existing script and the AI will identify weak points (via internal Doom-Scroller analysis), then output targeted fixes with `【✏️ 改动】` markers — never rewriting from scratch.
- **No Premature Saving**: The AI will **NOT** write scripts to files until you explicitly say `/save` or "定稿".

### Duration Calibration
Scripts adapt to your target video length:
- **≤30s**: Hook + 1 core point + CTA only, max 4-5 rows.
- **1-3 min (default = 60s)**: Full matrix with visual changes every 2-3 seconds.
- **3-5 min**: Chapter markers every 45-60s with relaxed 3-5s visual intervals.

If you don't specify a duration, the AI defaults to 60 seconds.

### Output Format: 4-Dimensional Micro-Pacing Matrix
Scripts are delivered in a high-density matrix to ensure retention:
- **Time**: Precise timestamps for every beat.
- **Visual Jolts**: Specific camera movements or visual changes to prevent scrolling. B-Roll/空镜头 is avoided by default (exception: travel/food content uses `【实景】` tags).
- **Screen Text & SFX**: On-screen captions and sound cues that reinforce the hook.
- **Audio/Dialogue**: The spoken script with embedded physical cues.

Every script also includes a **📦 发布三件套** (Publishing Kit):
- 3 candidate titles (optimized for Douyin search)
- Cover text (≤8 characters)
- 3-5 hashtags (mix trending + niche)

### Physical Humanizer
To beat the algorithm, we focus on raw human connection.
- **0.5s Golden Hook**: The first half-second must contain a physical or auditory "jolt" — no introductions.
- **Stage Directions**: Scripts include mandatory physical cues like `[深吸一口气]` (deep breath) or `[战术后仕]` (tactical lean back) to break the "AI-generated" feel.

### Shadow Logging
The AI learns your style silently.
- **How it works**: When you correct the AI's **writing style** (e.g., "too formal", "make it punchier"), it silently logs these preferences in `learnings/STYLE_CORRECTIONS.md`.
- **Style vs Content**: Only style feedback is logged ("太啰嗦", "说人话"). Content directions ("换个角度", "加一段关于价格的") are NOT logged.
- **Review**: Use `/preferences` to view, confirm, or delete all learned rules.

### Critic Usage
Summon a specialist to tear apart your draft.
- **Trigger**: Use `/critic [type]` or natural language like "找个茬".
- **Types**:
  - `Doom-Scroller` (default): Simulates an impatient FYP viewer with a stopwatch, flagging exact seconds where they'd swipe away.
  - `Data Hacker` (`/critic data`): Analyzes hook strength, info density per second, and CTA conversion potential.
  - `Emotion Manipulator` (`/critic emotion`): Maps the emotional arc, identifying tension drops that cause viewers to leave.
  - `Minimalist` (`/critic minimal`): Identifies every wasted word and frame, counting exact seconds saved by cutting fluff.
- **Rule**: The critic provides feedback but won't rewrite until you give the green light.

### Growth & Integrity
- **Anti-Hallucination Placeholders**: If a fact is unverified, the AI uses `⚠️ 待核实：此处需要XXX数据` instead of making it up.
- **Share-Triggers**: Every script ends with a shareable moment (e.g., "转给你那个XXX的朋友") instead of generic "点赞关注" CTAs. Exception: series content may use next-episode teasers.

### Evolution Process
Turn temporary corrections into permanent rules.
- **Trigger**: Use `/publish` or say "发视频了复盘一下".
- **Process**: The AI reviews `STYLE_CORRECTIONS.md`, moves frequent/important rules to `user_preferences.md`, and archives the finalized script to `data/published/`.

### Examples
- **New Script**: "帮我写个关于程序员加班的60秒脚本"
- **Revision**: Paste a script + "帮我改改，钩子不够强"
- **Inspiration**: `/inspire 一个认为自己是狗的猫的故事`
- **Critic**: `/critic data` or "让毒舌总监看看这个钩子"
- **Finalizing**: "这个版本不错，定稿吧。"
- **Review**: `/publish` or "视频发了，复盘一下。"
- **Preferences**: `/preferences` or "看看我的偏好"
