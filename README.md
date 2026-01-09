# SAT Ziyo

A modern, scalable SAT practice platform built with Next.js 14, TypeScript, Tailwind CSS, Zustand, and React Query.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query (TanStack Query)** - Server state management
- **shadcn/ui** - High-quality UI components

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── src/
│   ├── components/        # Reusable React components
│   │   ├── auth/         # Auth-specific components
│   │   └── ...           # Other components
│   ├── config/           # Configuration files
│   │   └── api.ts        # API configuration
│   ├── hooks/            # Custom React hooks
│   │   └── use-auth.ts   # Auth hooks with React Query
│   ├── services/         # API service layer
│   │   ├── api.ts        # Base API service
│   │   └── auth.service.ts # Auth service
│   ├── stores/           # Zustand stores
│   │   ├── auth.store.ts # Auth state
│   │   └── ui.store.ts   # UI state
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Shared types
│   ├── ui/               # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   └── lib/              # Utilities and providers
│       ├── utils.ts       # Utility functions
│       └── providers/     # React providers
│           └── query-provider.tsx
└── lib/                   # Additional utilities
    └── utils.ts           # cn() utility for class merging
```

## Features

### Code Splitting & Scalability

- Modular folder structure
- Separation of concerns (services, hooks, stores, components)
- Reusable components and hooks
- Type-safe with TypeScript

### State Management

- **Zustand** for client-side state (auth, UI)
- **React Query** for server state (API data, caching)

### UI Components

- shadcn/ui components
- Consistent design system
- Accessible and responsive

