# Architecture Documentation

## Scalable Code Structure

Bu loyiha to'liq scalable code splitting prinsiplari asosida qurilgan.

## Folder Structure

```
├── app/                          # Next.js App Router
│   ├── auth/                    # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx               # Root layout with providers
│   └── page.tsx                 # Homepage
│
├── src/
│   ├── components/              # Reusable React components
│   │   ├── auth/                # Auth-specific components
│   │   │   └── auth-form.tsx    # Reusable auth form
│   │   ├── error-boundary.tsx   # Error boundary component
│   │   └── error-message.tsx    # Error display component
│   │
│   ├── config/                  # Configuration files
│   │   └── api.ts               # API endpoints & config
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── index.ts             # Barrel export
│   │   └── use-auth.ts          # Auth hooks (React Query)
│   │
│   ├── services/                # API service layer
│   │   ├── api.ts               # Base API service class
│   │   └── auth.service.ts      # Auth API methods
│   │
│   ├── stores/                  # Zustand state stores
│   │   ├── index.ts             # Barrel export
│   │   ├── auth.store.ts        # Authentication state
│   │   └── ui.store.ts          # UI state (sidebar, theme)
│   │
│   ├── types/                   # TypeScript definitions
│   │   └── index.ts             # Shared types & interfaces
│   │
│   ├── ui/                      # shadcn/ui components
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── loading.tsx
│   │
│   └── lib/                     # Utilities & providers
│       ├── constants.ts          # App constants
│       ├── utils.ts              # Utility functions
│       └── providers/
│           └── query-provider.tsx # React Query provider
│
└── lib/                         # Root-level utilities
    └── utils.ts                  # cn() class utility
```

## State Management Architecture

### 1. Zustand Stores (Client State)

**Location**: `src/stores/`

- **auth.store.ts**: Authentication state

  - `user`: Current user object
  - `isAuthenticated`: Auth status
  - `isLoading`: Loading state
  - Actions: `setUser`, `setLoading`, `logout`

- **ui.store.ts**: UI state
  - `sidebarOpen`: Sidebar visibility
  - `theme`: Light/dark theme
  - Actions: `toggleSidebar`, `setTheme`

### 2. React Query (Server State)

**Location**: `src/hooks/`

- **use-auth.ts**: Auth mutations & queries
  - `useLogin()`: Login mutation
  - `useRegister()`: Register mutation
  - `useLogout()`: Logout mutation
  - `useCurrentUser()`: Get current user query

**Benefits**:

- Automatic caching
- Background refetching
- Error handling
- Loading states

## Service Layer

**Location**: `src/services/`

### Base API Service (`api.ts`)

- Centralized HTTP client
- Token management
- Error handling
- Request/response interceptors

### Feature Services (`auth.service.ts`)

- Domain-specific API methods
- Type-safe API calls
- Business logic separation

## Component Architecture

### UI Components (`src/ui/`)

- Base shadcn/ui components
- No business logic
- Reusable across the app

### Feature Components (`src/components/`)

- Business logic components
- Use hooks and services
- Composed of UI components

### Pages (`app/`)

- Route handlers
- Minimal logic
- Use components and hooks

## Code Splitting Strategy

### 1. Route-based Splitting

- Next.js automatically code-splits by route
- Each page in `app/` is a separate chunk

### 2. Component Splitting

- Components are lazy-loaded when needed
- Dynamic imports for heavy components

### 3. Service Splitting

- Services are imported only when needed
- Tree-shakeable exports

## Data Flow

```
User Action
    ↓
Page Component
    ↓
Custom Hook (React Query)
    ↓
Service Layer
    ↓
API Service
    ↓
Backend API
    ↓
Response → Store (Zustand) → UI Update
```

## Best Practices

### 1. Separation of Concerns

- **Services**: API communication
- **Hooks**: Data fetching logic
- **Stores**: Client state
- **Components**: UI rendering

### 2. Type Safety

- All types in `src/types/`
- TypeScript strict mode
- No `any` types

### 3. Reusability

- Shared components in `src/components/`
- Custom hooks for common patterns
- Utility functions in `src/lib/`

### 4. Scalability

- Modular structure
- Easy to add new features
- Clear file organization
- Barrel exports for clean imports

## Adding New Features

### 1. Add a new API endpoint:

1. Add endpoint to `src/config/api.ts`
2. Create service method in `src/services/`
3. Create hook in `src/hooks/`
4. Use hook in component

### 2. Add a new store:

1. Create store in `src/stores/`
2. Export from `src/stores/index.ts`
3. Use in components

### 3. Add a new component:

1. Create in `src/components/` or `src/ui/`
2. Use shadcn/ui for base components
3. Compose with existing components

## Environment Setup

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Dependencies

- **zustand**: State management
- **@tanstack/react-query**: Server state
- **@tanstack/react-query-devtools**: Dev tools
- **shadcn/ui**: UI components
- **tailwindcss**: Styling
- **typescript**: Type safety

## Performance Optimizations

1. **Code Splitting**: Automatic by Next.js
2. **React Query Caching**: Reduces API calls
3. **Zustand**: Lightweight state
4. **Tree Shaking**: Unused code elimination
5. **Dynamic Imports**: Lazy loading
