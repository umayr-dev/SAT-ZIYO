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

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

## Architecture

### State Management Pattern

1. **Zustand Stores** (`src/stores/`)

   - Client-side state (UI state, auth state)
   - Simple, lightweight, no boilerplate

2. **React Query Hooks** (`src/hooks/`)

   - Server state management
   - Automatic caching, refetching, error handling

3. **Services** (`src/services/`)
   - API communication layer
   - Centralized API logic

### Component Structure

- **UI Components** (`src/ui/`) - Base shadcn/ui components
- **Feature Components** (`src/components/`) - Business logic components
- **Pages** (`app/`) - Route pages using components and hooks

## Code Examples

### Using Zustand Store

```typescript
import { useAuthStore } from "@/src/stores";

function MyComponent() {
  const { user, isAuthenticated, setUser } = useAuthStore();
  // ...
}
```

### Using React Query Hook

```typescript
import { useLogin } from "@/src/hooks";

function LoginPage() {
  const loginMutation = useLogin();

  const handleSubmit = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration (Optional - if using custom API)
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Getting Supabase Credentials

1. Go to [Supabase](https://supabase.com) and create a new project
2. Navigate to **Project Settings** > **API**
3. Copy your **Project URL** (it should look like `https://xxxxx.supabase.co`)
4. Copy your **anon/public key** (it's a long string starting with `eyJ...`)
   - ⚠️ **IMPORTANT:** Use the **anon/public** key, NOT the **service_role** key
   - The anon key is safe to use in the browser
   - The service_role key should NEVER be exposed in the browser
5. Replace the placeholders in `.env.local` with your actual values

**Important:**

- Make sure to use the **anon/public key** (starts with `eyJ...`), NOT the service_role key
- The service_role key will cause "Forbidden use of secret API key in browser" error
- If you see this error, check your `.env.local` file and replace the key with the anon/public key

### Setting Up Google OAuth

To enable Google authentication, you need to configure it in both Supabase and Google Cloud Console:

#### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API** (or **Google Identity Services API**)
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. Choose **Web application** as the application type
7. Add **Authorized redirect URIs**:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://yourdomain.com/auth/callback`
   - **Also add Supabase redirect URL**: `https://jhfbraawmdjgrxjyolrv.supabase.co/auth/v1/callback`
8. Copy the **Client ID** and **Client Secret**

#### 2. Supabase Dashboard Setup

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Find **Google** in the list and click to enable it
4. Enter your **Google Client ID** and **Client Secret** from step 1
5. Save the changes

#### 3. Common Issues

**400 Bad Request Error:**

- Make sure Google provider is enabled in Supabase
- Verify that Client ID and Client Secret are correctly entered
- Ensure redirect URLs are added in both Google Console and Supabase
- Check that your Supabase project URL is correct in `.env.local`

**Redirect URI Mismatch:**

- The redirect URL must match exactly in both Google Console and Supabase
- For local development, use: `http://localhost:3000/auth/callback`
- Make sure to add the Supabase callback URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

## License

MIT
