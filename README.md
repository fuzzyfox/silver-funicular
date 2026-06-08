# Agent Usage Tracker — Raycast Extension

Check your **personal** AI subscription usage from Raycast — how much of your
Claude (and, soon, Codex) rate-limit windows you've consumed — without leaving
the launcher.

Usage is read **server-side**, from the same authenticated endpoint Claude
Code's `/usage` command uses, so it reflects your consumption across **all**
devices (desktop, mobile, web), not just this machine.

## Features

- 📊 Live 5-hour and 7-day rate-limit windows for your Claude subscription
- 🎨 Color-coded utilization (green → yellow → orange → red)
- ⏱️ "Resets in…" countdown per window
- 🔐 No API keys to configure — reads the OAuth token Claude Code already stores
- ⚡ Fetches on open and on ⌘R; no background polling

## How it works

The extension reads your existing Claude Code OAuth token and calls
`GET https://api.anthropic.com/api/oauth/usage`, which returns the
authoritative server-side window state for your subscription.

**Token source (macOS):** the login Keychain entry `Claude Code-credentials`
(written by Claude Code). The first read triggers a one-time macOS
"Always Allow" prompt. On Linux/Windows it falls back to
`~/.claude/.credentials.json`.

Tokens are read fresh on each open and used directly — the extension does not
refresh them. If your session has expired, run `claude` once to refresh it,
then reopen the command.

> **Note:** This is an unofficial, undocumented Anthropic endpoint. It may
> change without notice.

## Supported agents

| Agent      | Status           | Source                                                |
| ---------- | ---------------- | ----------------------------------------------------- |
| Claude     | ✅ Available     | `api.anthropic.com/api/oauth/usage` (OAuth)           |
| Codex      | 🚧 Planned       | ChatGPT backend usage endpoint (`~/.codex/auth.json`) |
| Raycast Ai | 🔭 Investigating | No known public usage API yet                         |

## Development

### Prerequisites

- [Raycast](https://www.raycast.com/) (macOS)
- [Node.js](https://nodejs.org/) 18+
- An active Claude Code session (`claude`)

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
│   └── claude.ts        # read the Claude Code OAuth token (Keychain / file)
├── clients/
│   └── claude.ts        # call the OAuth usage endpoint, normalise windows
├── types.ts             # AgentUsage / UsageWindow shapes
└── view-usage.tsx       # the Raycast list UI
```

### Scripts

- `npm run dev` — development mode with hot reload
- `npm run build` — production build
- `npm run lint` / `npm run fix-lint` — lint (and auto-fix)

## License

Mozilla Public License 2.0 — see [LICENSE](./LICENSE).
