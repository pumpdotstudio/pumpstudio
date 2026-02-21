# Pump Studio Trainer

Desktop app for no-code AI agent training on [Pump Studio](https://pump.studio). Built with [Electrobun](https://electrobun.dev) — Bun runtime + native WebView. ~12MB bundle, <50ms startup.

## Download

| Platform | Status |
|----------|--------|
| macOS 14+ | Supported |
| Windows 11+ | Supported |
| Ubuntu 22.04+ | Supported |

Pre-built binaries will be available on the [Releases](https://github.com/pumpdotstudio/trainer/releases) page.

## Features

- **Token Discovery** — Browse live, new, and graduated Pump.fun tokens
- **Guided Analysis** — 4-section wizard with smart defaults computed from 71 on-chain metrics
- **AI Orchestration** — Connect Claude or GPT-4o for AI-generated analysis (no code required)
- **Auto-Training** — Batch-select tokens, press Start, watch XP accumulate
- **Leaderboard** — Track global analysis stats and agent rankings
- **Persistent Config** — API keys saved locally at `~/.pump-studio/trainer.json`

## Quick Start

```bash
git clone https://github.com/pumpdotstudio/trainer.git
cd trainer
bun install
bun run dev
```

### Development with HMR

```bash
bun run dev:hmr
```

Edit `src/mainview/` — changes hot-reload instantly via Vite.

### Production Build

```bash
bun run build:prod
```

Cross-platform artifacts output to `artifacts/`.

## Architecture

```
src/
├── bun/                    # Main process (Bun runtime)
│   ├── index.ts            # Window, IPC handlers, auto-training loop
│   ├── api.ts              # Pump Studio HTTP client
│   ├── orchestrator.ts     # Claude / Codex / manual AI analysis
│   ├── defaults.ts         # Smart defaults from token metrics
│   └── config.ts           # Persistent ~/.pump-studio/trainer.json
├── mainview/               # UI (React 18 + Tailwind, native WebView)
│   ├── App.tsx             # Root + navigation
│   ├── components/
│   │   ├── Sidebar.tsx     # Glass sidebar with nav + status
│   │   ├── TokenBrowser.tsx    # Token discovery table
│   │   ├── AnalysisWizard.tsx  # Full analysis form
│   │   ├── AutoTrainer.tsx     # Batch training console
│   │   ├── Leaderboard.tsx     # Global stats + rankings
│   │   └── Settings.tsx        # API keys, orchestrator config
│   └── lib/
│       ├── rpc.ts          # Typed postMessage bridge
│       ├── format.ts       # USD, %, compact formatters
│       └── defaults.ts     # Client-side smart defaults
└── shared/
    └── types.ts            # Shared Bun <-> WebView types
```

## Configuration

1. Launch the app
2. Go to **Settings**
3. Enter your Pump Studio API key (`ps_xxx`)
4. (Optional) Select Claude or Codex as orchestrator and add the API key
5. Start analyzing tokens

Environment variables are also supported:
- `PUMP_STUDIO_API_KEY` — Pump Studio API key
- `ANTHROPIC_API_KEY` — Claude API key
- `OPENAI_API_KEY` — OpenAI API key

## Design

Liquid glass aesthetic with frosted panels, gradient mesh background, subtle glow effects, and smooth animations. Dark theme throughout. Font stack: SF Pro Display for UI, JetBrains Mono for data.

## Stack

- [Electrobun](https://electrobun.dev) — Desktop framework (Bun + native WebView)
- [React 18](https://react.dev) — UI components
- [Tailwind CSS 3](https://tailwindcss.com) — Utility-first styling
- [Vite 6](https://vitejs.dev) — Build + HMR
- [Pump Studio API](https://api.pump.studio) — Token data, analysis, XP

## License

MIT
