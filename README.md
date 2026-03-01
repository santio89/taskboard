# Tasks Board

A Kanban-style task dashboard built with React, TypeScript, and Vite. Fully client-side with local persistence — no backend required.

## Features

- **Drag & drop** tasks between columns and reorder both tasks and columns
- **Custom columns** with color picker, or quick-start with preset templates (To Do, In Progress, Done, etc.)
- **Task management** — create, edit, and delete tasks with title, description, priority levels, and tags
- **Start & due dates** — set date ranges with color-coded indicators (green = upcoming, yellow = soon, red = overdue)
- **Time estimates** — track estimated effort per task (e.g. 2h, 1d, 30m)
- **Subtasks / checklists** — add subtasks to any task with progress tracking on the card
- **File attachments** — attach files to tasks via click or drag-and-drop, stored in IndexedDB
- **Analytics dashboard** — SVG charts for task distribution, priority breakdown, creation timeline, and top tags
- **Search & filter** — expandable search bar with priority filter pills
- **Collapse / expand columns** — minimize columns to just their header
- **Dark / Light mode** — dark by default, smooth theme transitions, no white flash on load
- **Keyboard shortcuts** — `N` new task, `T` toggle theme, `/` focus search, `Esc` close modals
- **Export / Import** — download your board as JSON and re-import it anytime
- **Confetti** — micro-animation when a task moves to a "Done"-type column
- **Markdown** — supports bold, italic, code, strikethrough, and links in task descriptions
- **Delete confirmations** — themed confirm dialog before deleting tasks or columns
- **Toast notifications** — custom themed toasts for import success/error feedback
- **Error boundary** — graceful error recovery with a themed fallback UI
- **Custom UI throughout** — no native browser elements; custom tooltips, scrollbars, selects, dialogs, and validation
- **Responsive** — works on mobile with a stacked column layout
- **Local persistence** — tasks and columns saved to localStorage, attachments to IndexedDB

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server and bundling
- [@dnd-kit](https://dndkit.com/) for drag-and-drop
- [Lucide React](https://lucide.dev/) for icons
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for testing
- localStorage + IndexedDB for client-side storage

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
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |

## Testing

49 tests across 5 test suites covering:

- **Task store** — CRUD operations, reordering, column deletion, corrupted data handling
- **Column store** — CRUD operations, reordering, defaults, corrupted data handling
- **Markdown renderer** — bold, italic, code, strikethrough, links, XSS prevention
- **Theme hook** — default state, toggle, localStorage persistence, DOM attribute sync
- **Components** — ConfirmDialog, SearchBar, ColumnModal rendering, interaction, and validation

```bash
npm test
```

## Project Structure

```
src/
├── components/       # React components (modals, cards, columns, search, etc.)
├── hooks/            # Custom hooks (useTheme)
├── store/            # Data layer (localStorage + IndexedDB)
├── types/            # TypeScript interfaces and constants
├── utils/            # Utilities (markdown, confetti, toast)
├── test/             # Test suites and setup
├── App.tsx           # Main application
├── main.tsx          # Entry point
└── index.css         # All styles and theming
```
