# TASKBOARD

Kanban-style task dashboard: React, TypeScript, Vite.

## Features

- **Drag & drop** — Reorder tasks and columns.
- **Task management** — Title, description, priority, tags, subtasks, dates, attachments.
- **Analytics** — Charts and dashboards.
- **Search & filter** — Search tasks, filter by priority.
- **Settings** — Theme, language, animations.
- **Transfer** — Import/export board (JSON).
- **Local Persistence** — localStorage + IndexedDB for attachments.
- **Shortcuts** — `N` new task, `T` theme, `/` search, `Esc` close.

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
