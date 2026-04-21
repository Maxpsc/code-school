# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project Overview

This is an interview preparation playground containing algorithm questions and React demos. Used for reviewing interview topics by running code in browser and observing console output.

## Commands

```bash
pnpm dev        # Start Vite dev server (http://localhost:5173)
pnpm build      # Build for production
pnpm preview    # Preview production build
npx tsc --noEmit  # Type check
```

## Tech Stack

- **Vite** - Build tool and dev server
- **React 18** - UI library with concurrent features
- **TypeScript** - Strict mode enabled
- **React Router v7** - Client-side routing

## Architecture

### Source Structure

```
src/
├── main.tsx           # App entry with routes
├── dp/                # Dynamic programming problems
│   ├── knapsack.ts    # 0-1 knapsack, complete knapsack, multiple knapsack
│   └── skiing.ts      # Skiing problem (matrix path)
├── js/                # JavaScript questions
│   └── debounce-throttle.js
├── linked-list/       # Linked list problems
│   ├── base-linked-list.ts
│   └── lru-cache.ts
└── react/             # React demos
    ├── hooks.ts       # Custom hooks (useLatest, useMemoizedFn, useInterval, useTimeout, useDebounce)
    ├── new-features.ts # React v16/v18 new features
    ├── profiler-demo/
    │   └── HeavyRenderDemo.tsx   # Renders performance issues demo
    ├── virtual-list-demo/
    │   └── VirtualListDemo.tsx   # Virtual scrolling comparison
    └── reducer-context-list/     # useReducer + Context pattern
```

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | Home | Navigation to all demos |
| `/task-list` | App | useReducer + Context demo |
| `/profiler-demo` | HeavyRenderDemo | Render performance issues |
| `/virtual-list` | VirtualListDemo | Virtual vs normal list |

### TypeScript Config

- `target: ES2020` - Modern browsers
- `jsx: react-jsx` - React 18 new JSX transform
- `strict: true` - Full type checking
- `isolatedModules: true` - ESM compliance

## Development Notes

- All algorithm code files are imported in main.tsx and execute on load
- Algorithm results print to browser console
- React components require JSX files with `.tsx` extension
- Context providers use generic types for better type inference
