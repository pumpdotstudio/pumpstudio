# Pump.studio

<p align="center">
  <img src="pumpstudio.png" alt="Pump.studio" width="100%" />
</p>

Native desktop app for [pump.studio](https://pump.studio). Built with [Electrobun](https://electrobun.dev) — Bun runtime + native WKWebView. 17 MB bundle, <50ms startup.

[![Pump.studio](https://img.shields.io/badge/Pump.studio-000?style=flat&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgZmlsbD0iIzIyYzU1ZSI+PGNpcmNsZSBjeD0iOCIgY3k9IjgiIHI9IjgiLz48L3N2Zz4=&logoColor=22c55e)](https://pump.studio)
[![API Docs](https://img.shields.io/badge/skill.md-API%20Docs-22c55e?style=flat)](https://pump.studio/skill.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

---

## Download

Download the latest from [Releases](https://github.com/pumpdotstudio/pumpstudio/releases).

| Platform | Status |
|----------|--------|
| macOS ARM64 (M1/M2/M3/M4) | [v0.1.0](https://github.com/pumpdotstudio/pumpstudio/releases/tag/v0.1.0) |
| macOS Intel | Coming soon |
| Windows | Coming soon |
| Linux | Coming soon |

## Features

- **Native macOS menus** — Pump.studio, Edit, View, Go, Window, Help
- **Keyboard shortcuts** — Cmd+1-4 navigation, Cmd+R reload, Cmd+[] back/forward
- **Hidden title bar** — Traffic light integration with content padding
- **17 MB app** — No CEF bundled, uses native WKWebView
- **Auto-updates** — Wraps pump.studio — always up to date

## Quick Start

```bash
git clone https://github.com/pumpdotstudio/pumpstudio.git
cd pumpstudio
bun install
bun run dev
```

### Production Build

```bash
npx electrobun build --env=stable
```

Artifacts output to `artifacts/`. The `.app` bundle is in `build/stable-macos-arm64/`.

## Architecture

```
src/
├── bun/                    # Main process (Bun runtime)
│   ├── index.ts            # Window, menus, CSS injection, IPC, auto-training
│   ├── api.ts              # Pump Studio HTTP client
│   ├── orchestrator.ts     # Claude / Codex / manual AI analysis
│   ├── defaults.ts         # Smart defaults from token metrics
│   └── config.ts           # Persistent ~/.pump-studio/trainer.json
├── mainview/               # UI (React 18 + Tailwind, for local views)
└── shared/
    └── types.ts            # Shared Bun <-> WebView types
```

## Stack

- [Electrobun](https://electrobun.dev) — Desktop framework (Bun + native WebView)
- [pump.studio](https://pump.studio) — Web app (Next.js 15, Convex, Solana)
- [Pump Studio API](https://api.pump.studio) — Token data, analysis, XP

## License

MIT
