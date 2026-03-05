# termviz

> **Render diagrams and UI previews inline in any terminal.**  
> Mermaid → PNG → Kitty / iTerm2 / SIXEL / ASCII fallback. No browser. No context switch.

[![WIP — GSoC PoC](https://img.shields.io/badge/status-gsoc--poc-blueviolet)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![pnpm workspace](https://img.shields.io/badge/pnpm-workspace-orange)](https://pnpm.io)

---

## Demo

```bash
termviz diagram --spec-file demos/auth-seq.mmd
termviz diagram --spec-file demos/service-flow.mmd
termviz diagram --spec-file demos/erd.mmd
```

| Terminal     | Protocol | Result                     |
|-------------|-----------|----------------------------|
| Kitty        | Kitty     | Pixel-perfect inline PNG   |
| iTerm2       | iTerm2    | Pixel-perfect inline PNG   |
| xterm/WezTerm| SIXEL     | High-quality raster image  |
| Any other    | ASCII     | Unicode box-drawing art    |

Check what your terminal supports:

```bash
termviz info
```

---

## Install (from source)

```bash
git clone <repo>
cd termviz
pnpm install
pnpm build
# Link globally (for termviz command)
pnpm --filter termviz link --global
```

**Requirements:** Node 18+, pnpm 8+

---

## Usage

### Render a diagram file

```bash
# Any .mmd file or .md with a ```mermaid block
termviz diagram --spec-file path/to/diagram.mmd

# With options
termviz diagram --spec-file demo.mmd --theme dark --width 1400

# Force a specific protocol (for testing)
termviz diagram --spec-file demo.mmd --protocol ascii
termviz diagram --spec-file demo.mmd --protocol kitty

# Inline spec
termviz diagram --spec "graph TD; A-->B; B-->C"
```

### Terminal info

```bash
termviz info
# Outputs: detected protocol, color depth, columns, rows, cache dir
```

---

## Architecture

```
Mermaid spec
    │
    ▼
packages/core/src/pipeline/run.ts   ← orchestrator
    │
    ├── cache/index.ts              ← SHA256 content-hash cache (~/.cache/termviz/)
    │
    └── render/mermaid.ts           ← Puppeteer → SVG screenshot → PNG buffer
              │
              └── render/ascii.ts  ← Unicode box-drawing fallback (no Puppeteer needed)
                          │
                          ▼
packages/cli/src/caps/detect.ts    ← env-var terminal detection
    │
    ├── encode/kitty.ts             ← ESC_G chunked base64
    ├── encode/iterm2.ts            ← OSC 1337 base64
    ├── encode/sixel.ts             ← via `sixel` npm package + Sharp resize
    └── encode/ascii.ts             ← delegates to core ascii renderer
              │
              ▼
        stdout (escape sequences)
```

### Cache

- Location: `~/.cache/termviz/`
- Key: `sha256(spec + diagramType + theme + widthPx + rendererVersion)`
- Stores: `<hash>.png` + `<hash>.meta.json`
- Eviction: LRU, max 100 files (removes oldest 20% on overflow)

---

## Packages

| Package | Description |
|---------|-------------|
| [`@termviz/core`](packages/core) | Render pipeline, cache, renderers — zero terminal dependency |
| [`termviz`](packages/cli) | CLI binary, terminal detection, protocol encoders |

---

## Roadmap

- [x] **Milestone 1**: Mermaid inline rendering (Kitty / iTerm2 / SIXEL / ASCII)
- [ ] **Milestone 2**: HTML/CSS/React → screenshot → terminal (Puppeteer)
- [ ] **Milestone 3**: Dependency graph from `package.json` / `requirements.txt`
- [ ] **Milestone 3**: Git branch graph + contributor timeline
- [ ] **Integration**: Gemini CLI tool + slash command wiring

---

## Development

```bash
pnpm install     # Install all deps
pnpm build       # Build all packages
pnpm dev         # Watch mode
pnpm test        # Run all tests
pnpm lint        # ESLint
pnpm format      # Prettier
```

---

## GSoC Context

This is a proof-of-concept implementation for **GSoC #12 — Generative Architecture & UI Visualization** for [Gemini CLI](https://github.com/google-gemini/gemini-cli).

The goal: teach Gemini CLI to *draw* — rendering architecture diagrams, dependency graphs, and live UI previews directly inside the terminal, with no browser or IDE required.
