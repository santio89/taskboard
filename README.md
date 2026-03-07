# TASKBOARD

Kanban-style task dashboard: React, TypeScript, Vite. Fully client-side, no backend.

## Features

- **Drag & drop** — reorder tasks and columns (dnd-kit + Framer Motion)
- **Custom columns** — 19 preset colors (2×10 grid) + custom color picker (gradient, hue, RGB, eyedropper); quick-start presets in Columns dropdown
- **Task management** — title, description, priority, tags, subtasks, dates, estimates, attachments
- **Custom date picker** — theme-aware Start/Due date calendars; opens above field, portaled
- **Subtasks** — add, reorder, check off; 2-line clamp + tooltip
- **Analytics** — Basic & Advanced dashboards (column distribution, priority donut, timeline, task age, workload, top tags)
- **Search & filter** — expandable popover, priority filters
- **Settings** — Theme (Light/Dark), Language (EN/ES), Animations on/off
- **Markdown** — bold, italic, code, strikethrough, links in descriptions
- **Transfer** — Import/Export board (JSON)
- **Shortcuts** — `N` new task, `T` theme, `/` search, `Esc` close
- **Persistence** — localStorage (settings/theme/board), IndexedDB (attachments)

## Tech

React 19, TypeScript, Vite, @dnd-kit, Framer Motion, Vitest + Testing Library.

## Quick start

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Type-check + production build |
| `npm test` | Run tests (87) |
