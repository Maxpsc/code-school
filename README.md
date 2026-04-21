# Code School

Interview preparation playground with algorithm questions and React demos.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library with concurrent features
- **TypeScript** - Strict mode enabled
- **React Router v7** - Client-side routing

## Getting Started

```bash
pnpm install
pnpm dev
```

Visit http://localhost:5173

## Commands

```bash
pnpm dev        # Start Vite dev server
pnpm build      # Build for production
pnpm preview    # Preview production build
npx tsc --noEmit  # Type check
```

## Project Structure

```
src/
├── main.tsx           # App entry with routes
├── dp/                # Dynamic programming problems
├── js/                # JavaScript questions
├── linked-list/       # Linked list problems
└── react/             # React demos
    ├── hooks.ts       # Custom hooks
    ├── new-features.ts # React v16/v18 new features
    ├── profiler-demo/ # Render performance demo
    ├── virtual-list-demo/ # Virtual scrolling
    └── reducer-context-list/ # useReducer + Context
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Home | Navigation to all demos |
| `/task-list` | App | useReducer + Context demo |
| `/profiler-demo` | HeavyRenderDemo | Render performance |
| `/virtual-list` | VirtualListDemo | Virtual vs normal list |
