# VibeCheck Technologies
**Enterprise Code Intelligence Platform**
*No technical feedback was given or implied*

---

## What it does

VibeCheck is a VS Code extension that reviews your code using exclusively Gen Z slang and vibes. It has no technical knowledge. It will not help you write better code. It will tell you that your variable names are "giving 2019 Stack Overflow energy."

**Features:**
- **Hover tooltips** — hover over any function or block, Dave reviews it in real time
- **Right-click review** — select any code, right-click → "VibeCheck: Review This Code"  
- **Full file review** — right-click → "VibeCheck: Review Entire File" opens a side panel with a full report and official Vibe Score™

---

## Setup

### 1. Install dependencies & compile

```bash
cd vibecheck
npm install
npm run compile
```

### 2. Get an Gemini API key

Sign up at [aistudio.google.com](https://aistudio.google.com) — costs pennies per review.

### 3. Load the extension in VS Code

- Open the `vibecheck` folder in VS Code
- Press `F5` to launch an Extension Development Host window
- A new VS Code window opens with VibeCheck active

### 4. Set your API key

In the new window, open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) and run:
```
VibeCheck: Set Gemini API Key
```

That's it. Hover over any code.

---

## Packaging as a .vsix (to install permanently or share)

```bash
npm run package
```

This produces `vibecheck-1.0.0.vsix`. Install it in VS Code:
```
Extensions panel → ... menu → Install from VSIX
```

---

## Tweaking Dave's personality

Edit the `SYSTEM_PROMPT` in `src/dave.ts`. Some ideas:
- Make him meaner
- Lock him into one specific slang era (2020 TikTok only, etc.)
- Make him randomly reference unrelated topics (Minecraft, Inception, etc.)
- Give him a rival — another AI reviewer named Karen who loves semicolons

---

## Settings

| Setting | Default | Description |
|---|---|---|
| `vibecheck.hoverEnabled` | `true` | Toggle hover tooltips on/off |
| `vibecheck.hoverDelayMs` | `800` | Delay before Dave weighs in (ms) |
| `vibecheck.geminiApiKey` | — | Your API key |

---

## File structure

```
vibecheck/
├── src/
│   ├── extension.ts     — entry point, registers commands
│   ├── dave.ts        — API client, caching, the prompt
│   ├── hoverProvider.ts — hover tooltip logic
│   └── panel.ts         — full file review side panel
├── package.json         — extension manifest
└── tsconfig.json
```

---

*VibeCheck Technologies is not responsible for any decrease in code quality, team morale, or understanding of what 'rizz' means.*
