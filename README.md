# PromptNest

[![Download Latest Release](https://img.shields.io/badge/Download-v0.2.1-blue?style=for-the-badge&logo=github)](https://github.com/bilals2008/prompt-nest/releases/tag/v0.2.1)

A modern desktop application for saving, organizing, and managing prompts with a clean productivity-focused experience.

## Overview

PromptNest is a lightweight desktop prompt manager built for creators, developers, designers, and AI users who want a fast and organized workspace for storing prompts locally with future-ready cloud sync support.

The application focuses on:

- simplicity
- speed
- organization
- offline-first experience
- clean desktop UI

## Download

You can download the latest installer for Windows from the [releases page](https://github.com/bilals2008/prompt-nest/releases/tag/v0.2.1).

> **Note:** macOS and Linux builds are not yet available.

---

## Features

### Prompt Management

- Create prompts
- Edit prompts
- Delete prompts
- Favorite prompts
- Pin prompts
- Copy prompts instantly
- Markdown support with live preview
- Notes field for extra context

### Organization

- Folder support
- Collections with color coding
- Tags with rename, merge, and delete
- Categories
- Recent prompts
- Batch actions (select multiple prompts)

### Search

- Global spotlight search (Ctrl+K)
- Fast prompt search
- Filter by category or folder
- Quick access workflow

### Desktop Experience

- Native desktop-style layout
- Compact sidebar navigation
- Keyboard shortcuts (Ctrl+N, Ctrl+E, Ctrl+D)
- Resizable panels
- Smooth interactions
- Auto-updates via GitHub releases
- Start on system boot option

### Templates

- Pre-built prompt templates
- Quick template access

### Export / Import

- CSV export and import
- Selective export
- Full database backup and restore

### Editor

- Markdown support
- Code block support
- Live preview mode
- Clean writing experience

### Themes

- Light and dark mode
- Multiple theme variants (Midnight, Rose, Mocha, Cyberpunk, Sage, Amber, Read)
- System theme detection

### Settings

- User preferences management
- Confirm before delete option
- Database statistics
- App info and session tracking

### Storage

- SQLite database
- Local-first architecture
- Offline support
- Future cloud sync support

---

## Tech Stack

### Frontend

- React 19
- Vite 8
- Tailwind CSS v4
- shadcn/ui v4.7.0 (Nova)

### Desktop

- Electron 42
- electron-updater (auto-updates)

### State Management

- Zustand

### Database

- SQLite3

### Utilities

- clsx
- tailwind-merge
- class-variance-authority
- @tabler/icons-react
- react-markdown + remark-gfm + rehype-raw
- react-hotkeys-hook
- react-resizable-panels
- recharts
- sonner
- date-fns

---

## Changelog

### v0.2.1

- Removed Electron and React badges from Settings
- Added Desktop App badge
- Added social links in Settings footer
- Added Changelog link in Settings > Resources
- Default theme changed to Cyberpunk

### v0.2.0

- Spotlight search (Ctrl+K) for quick access
- Cyberpunk and Sage theme variants
- Expanded color theme options
- Read theme for distraction-free reading
- CSV export/import with selective export
- Confirm before delete setting now works across app
- Backend support for prompt committing

### v0.1.0

- Spotlight search (Ctrl+K)
- Cyberpunk and Sage themes
- Expanded color theme options
- Read theme
- CSV export/import with selective export
- Confirm before delete setting
- Backend support for prompt committing

### v0.0.11-beta

- User settings management system
- Keyboard shortcuts (Ctrl+N, Ctrl+E, Ctrl+D)
- Amber light theme with light/dark categorization
- Command palette (replaced onboarding tour)
- Tag management with rename, merge, and delete
- Rose and Mocha theme variants
- Refined sidebar, cards, and settings UI

### v0.0.10-beta

- Midnight theme
- Theme configuration and appearance settings updates

### v0.0.9-beta

- Onboarding tour with react-joyride
- HTML rendering in update dialog release notes
- Automated update dialog trigger in sidebar

### v0.0.8-beta

- Batch delete for collections
- Copy-to-clipboard on prompt cards
- Prompt pinning
- Markdown support and preview mode in editor
- Batch actions for prompts
- Icon library migration to @tabler/icons-react
- Improved release scripts

### v0.0.7-beta

- Initial tagged release
- Core prompt CRUD operations
- Folder and collection management
- Tags and categories
- Search and filtering
- Dashboard with stats
- Auto-update system
- Light/dark theme
- Settings page with database management
- Changelog page
- Activity logging
- Data export/import
- Templates system
- Pagination and loading states

---

## Goals

The goal of PromptNest is to provide a calm and professional workspace for prompt organization without unnecessary complexity or distracting UI trends.

The application is designed to feel:

- lightweight
- modern
- focused
- fast
- desktop-native

---

## Development

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build for Windows:

```bash
npm run dist:win
```

Build and publish to GitHub releases:

```bash
export GH_TOKEN="<your-github-token>"
npm run release
```

---

## Philosophy

PromptNest prioritizes usability and clarity over flashy visuals.

The experience should remain:

- minimal
- structured
- productivity-focused
- distraction-free
