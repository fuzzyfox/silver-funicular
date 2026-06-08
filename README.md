# Agent Usage Tracker — Raycast Extension

Check your **personal** AI subscription usage from Raycast — how much of your
Claude and Codex rate-limit windows you've consumed — without leaving the
launcher.

Usage is read **server-side**, from the same authenticated endpoints Claude
Code's `/usage` and Codex's `/status` use, so it reflects your consumption
across **all** devices (desktop, mobile, web), not just this machine.

## Features

- 📊 Live 5-hour and 7-day rate-limit windows for Claude and Codex
- 🎨 Color-coded utilization (green → yellow → orange → red)
- ⏱️ "Resets in…" countdown per window
- 🔐 No API keys to configure — reads the OAuth tokens Claude Code and Codex
  already store
- ⚡ Fetches on open and on ⌘R; no background polling

## How it works

Each provider's existing OAuth token is read locally and used to call its
server-side usage endpoint:

- **Claude** — `GET https://api.anthropic.com/api/oauth/usage`, the same window
  state Claude Code's `/usage` shows.
- **Codex** — `GET https://chatgpt.com/backend-api/wham/usage`, the same data
  Codex's `/status` shows.

**Token sources:**

- **Claude (macOS):** the login Keychain entry `Claude Code-credentials`
  (written by Claude Code). The first read triggers a one-time macOS
  "Always Allow" prompt. On Linux/Windows it falls back to
  `~/.claude/.credentials.json`.
- **Codex:** `~/.codex/auth.json` (also honours `CODEX_HOME` and
  `~/.config/codex/auth.json`), written by the `codex` CLI on login.

Tokens are read fresh on each open and used directly — the extension does not
refresh them. If a session has expired, run `claude` / `codex` once to refresh
it, then reopen the command.

> **Note:** These are unofficial, undocumented endpoints. They may change
> without notice.

## Supported agents

| Agent      | Status           | Source                                       |
| ---------- | ---------------- | -------------------------------------------- |
| Claude     | ✅ Available     | `api.anthropic.com/api/oauth/usage` (OAuth)  |
| Codex      | ✅ Available     | `chatgpt.com/backend-api/wham/usage` (OAuth) |
| Raycast Ai | 🔭 Investigating | No known public usage API yet                |

## Development

### Prerequisites

- [Raycast](https://www.raycast.com/) (macOS)
- [Node.js](https://nodejs.org/) 18+
- An active Claude Code session (`claude`) and/or Codex session (`codex`)

### Run locally

```bash
npm install
npm run dev      # ray develop — imports the command into Raycast with hot reload
```

Then open **View Agent Usage** in Raycast.

### Project structure

```
src/
├── auth/
│   ├── claude.ts        # read the Claude Code OAuth token (Keychain / file)
│   └── codex.ts         # read the Codex OAuth token (auth.json)
├── clients/
│   ├── claude.ts        # call Anthropic's usage endpoint, normalise windows
│   └── codex.ts         # call ChatGPT's usage endpoint, normalise windows
├── types.ts             # AgentUsage / UsageWindow shapes
└── view-usage.tsx       # the Raycast list UI
```

### Scripts

- `npm run dev` — development mode with hot reload
- `npm run build` — production build
- `npm run lint` / `npm run fix-lint` — lint (and auto-fix)

## License

Mozilla Public License 2.0 — see [LICENSE](./LICENSE).
