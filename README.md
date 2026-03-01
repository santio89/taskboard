# TASKBOARD

A Kanban-style task dashboard built with React, TypeScript, and Vite. Fully client-side — no backend required.

## Features

- **Drag & drop** — reorder tasks and columns with smooth animations
- **Custom columns** — color picker or quick-start presets
- **Task management** — title, description, priority, tags, subtasks, dates, estimates, file attachments
- **Analytics** — SVG charts for distribution, priorities, timeline, and tags
- **Search & filter** — expandable search with priority filters
- **Dark / Light mode** — smooth theme transitions, no white flash
- **Markdown** — bold, italic, code, strikethrough, links in descriptions
- **Export / Import** — download and restore your board as JSON
- **Keyboard shortcuts** — `N` new task, `T` toggle theme, `/` search, `Esc` close
- **Local persistence** — localStorage + IndexedDB for attachments

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [@dnd-kit](https://dndkit.com/)
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm test` | Run test suite (52 tests) |
