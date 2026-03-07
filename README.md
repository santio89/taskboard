# TASKBOARD

A Kanban-style task dashboard built with React, TypeScript, and Vite. Fully client-side — no backend required.

## Features

- **Drag & drop** — reorder tasks and columns with smooth animations (powered by dnd-kit + Framer Motion)
- **Custom columns** — color picker or quick-start presets via the Columns dropdown
- **Task management** — title, description, priority, tags, subtasks, dates, estimates, file attachments
- **Custom date picker** — theme-aware Start date / Due date calendars (no native picker); opens above the field, portaled so the modal doesn’t scroll
- **Subtasks** — add, reorder, check off; titles clamp to 2 lines with ellipsis and show full text in a tooltip on hover
- **Analytics** — Basic and Advanced dashboards with SVG charts (column distribution, priority donut, timeline, task age, workload by day, top tags)
- **Search & filter** — expandable search popover with priority filters
- **Settings** — gear icon popup with:
  - **Theme** — Light / Dark mode selector
  - **Language** — English / Spanish (i18n across all UI strings)
  - **Animations** — Enable / Disable all transitions and animations
- **Markdown** — bold, italic, code, strikethrough, links in descriptions
- **Transfer** — single button with Import / Export board options (JSON)
- **Keyboard shortcuts** — `N` new task, `T` toggle theme, `/` search, `Esc` close
- **Local persistence** — localStorage for settings/theme/board + IndexedDB for attachments

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [@dnd-kit](https://dndkit.com/)
- [Framer Motion](https://www.framer.com/motion/)
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
| `npm test` | Run test suite (82 tests) |
