# MicrointeractionLab (Microinteraction Lab)

Web playground for designing and testing UI microinteractions in real time, with instant preview and code generation.

## Features

- Playground with **Preview** + **Controls** + **Code Panel**
- Real-time config updates (duration, delay, easing, transforms, opacity, shadow)
- Triggers:
  - `hover`
  - `click`
  - `auto / load` (timeline scrubbing + configurable peak)
  - `hover + click` (multi-trigger mode)
- **Compare mode (A/B)** with quick `A→B`, `B→A`, and `Swap`
- **Gallery** with:
  - Presets (hover/focus preview in the main Preview area)
  - Saved setups (local-only)
  - Favorites + Likes
  - Tag filtering
- **Undo/Redo + Animation History**
- **Auto export/import**:
  - Share link via URL (`?share=...`)
  - JSON export/import
  - Download code snippet
- **Accessibility**:
  - `prefers-reduced-motion` support
  - Reduced Motion simulation switch
- **Performance meter** (FPS)
- **GitHub integration** (API):
  - Create Gist
  - Create Issue
  - Create PR (commit + open)
  - Includes pre-flight `Check access` and human-friendly errors

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand (state + local persistence)

## Getting Started

```bash
npm install
npm run dev
```

Open: `http://localhost:5173`

### Build

```bash
npm run build
```

### Typecheck

```bash
npm run typecheck
```

## GitHub Integration (PAT)

In **Code Panel** → **GitHub integration** you can paste a GitHub Personal Access Token (PAT).

Needed scopes (typical):
- `gist` (for Gists)
- `repo` (for private repositories, Issues/PR/contents)
- or `public_repo` (for public repositories)

The app sends requests directly to `api.github.com` from the browser, so do not reuse tokens across untrusted environments.

## Share Links / Export-Import

Share links encode the current `animationA` and `animationB` setup into the URL query (`share` param).
Anyone with the link can restore the exact configuration in the app.

## License

See `LICENSE`.
