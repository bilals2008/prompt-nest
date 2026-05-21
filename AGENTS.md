# AGENTS.md — Prompt Nest

## Project Overview
Electron + React 19 + Vite 8 desktop app. JavaScript (no TypeScript). Tailwind CSS v4 with shadcn/ui v4.7.0 (Nova/Radix style).

## Tech Stack
- **Build**: Vite 8 + `vite-plugin-electron` (simple mode)
- **UI**: React 19, Tailwind CSS v4, shadcn/ui v4.7.0 (Nova preset, Radix base)
- **Desktop**: Electron 42, `electron-builder` 26
- **Linting**: ESLint 10 flat config (`eslint.config.mjs`)
- **Package Manager**: npm (with `"type": "module"`)

## Project Structure
```
electron/          # Electron main & preload (ESM, .js)
  main.js          # BrowserWindow creation, Vite dev / production loading
  preload.js       # contextBridge exposing ipcRenderer methods
src/
  main.jsx         # React entry point (ReactDOM.createRoot)
  App.jsx          # Root component (login card demo)
  index.css        # Tailwind v4 imports + CSS variables (light/dark theme)
  App.css          # App-specific styles
  components/
    theme-provider.jsx   # React context for dark/light/system theme
    mode-toggle.jsx      # Theme toggle via DropdownMenu
    ui/                  # shadcn components (button, card, input, label, dropdown-menu, badge)
  lib/
    utils.js       # cn() helper (clsx + tailwind-merge)
  assets/
vite.config.js     # Vite config: react, tailwindcss, electron plugin, @/ alias
components.json    # shadcn config ("tsx": false, style: "radix-nova")
jsconfig.json      # @/* path alias for editor & shadcn CLI
eslint.config.mjs  # ESLint flat config (browser + node globals)
index.html         # Entry HTML, references src/main.jsx
```

## Key Conventions
- **No TypeScript** — all files are `.js` / `.jsx`
- **ESM everywhere** — `"type": "module"` in package.json
- **Absolute imports** — use `@/` alias (maps to `./src/`)
- **shadcn components** — generated with `"tsx": false`; no `.tsx` files
- **CSS** — Tailwind v4 with CSS variables for theming; add custom theme tokens via `@theme inline` in `index.css`
- **Electron** — main process entry: `electron/main.js`; preload: `electron/preload.js`
- **Explicit file extensions** — all imports include `.jsx` / `.js` extension

## Available Scripts
```bash
npm run dev      # Start Vite dev server with Electron
npm run build    # Vite build + electron-builder packaging
npm run lint     # ESLint check (flat config)
npm run preview  # Vite preview (serves built files)
```

## shadcn/ui Usage
- Config: `components.json` (tsx: false, style: radix-nova, iconLibrary: lucide)
- Add new components: `npx shadcn@latest add <component-name>`
- All generated components go to `src/components/ui/`
- Uses `radix-ui` unified package (but individual `@radix-ui/*` packages remain as transitive deps)

## ESLint Config Notes
- Flat config in `eslint.config.mjs`
- Uses `@eslint/js` recommended rules
- `globals` package for browser + node + es2021 globals
- Ignores `dist/` and `dist-electron/`

## Electron Notes
- `vite-plugin-electron/simple` mode — entry points defined in vite config
- Preload exposes `window.ipcRenderer` (on, off, send, invoke)
- Main process loads Vite dev URL in dev mode, `dist/index.html` in production
- `dist-electron/main.js` is the production electron entry (set in package.json `"main"`)

## Boilerplate Copy
A clean boilerplate copy of this project is kept at:
`D:\backup\OneDrive\Desktop\electron-js`
