# State Management Guide

> **Updated:** 2026-03-26 | **Recommends:** TanStack Query v5 + Zustand

---

## Recommendation: TanStack Query + Zustand

This project uses a **split responsibility** approach:

| Tool | Responsibility | When to use |
|------|---------------|-------------|
| **TanStack Query** | Server state — API data fetching, caching, mutations | All data from API calls |
| **Zustand** | Client state — UI state, modals, theme, user preferences | Anything NOT from API |

**Why not Redux?** Overkill for this project. Redux Toolkit adds unnecessary complexity. Zustand is 1KB and handles all client state needs.

---

## TanStack Query — API Data

### Setup

```typescript
// lib/tanstack-query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,         // 1 minute — consider fresh for 1 min
            gcTime: 10 * 60 * 1000,      // 10 minutes — keep in cache 10 min
            retry: 1,                    // retry once on failure
            refetchOnWindowFocus: false, // don't refetch on tab switch
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Wrap in root layout

```typescript
// app/layout.tsx (or wherever providers go)
import { TanstackQueryProvider } from "@/lib/tanstack-query-provider";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TanstackQueryProvider>
          {children}
        </TanstackQueryProvider>
      </body>
    </html>
  );
}
```

---

## Query Key Conventions

**Format:** `["resource", id?, options?]`

```typescript
// All orders — list
queryKey: ["orders"]

// Single order — detail
queryKey: ["orders", orderId]

// Orders with filters
queryKey: ["orders", { page: 1, status: "pending" }]

// My assigned tasks
queryKey: ["tasks", "my"]
```

### Predefined Query Keys (recommended constants)

```typescript
// lib/queries/keys.ts
export const queryKeys = {
  // Auth
  auth: ["auth"] as const,
  me: ["auth", "me"] as const,

  // Content
  services: (id?: string) => (id ? ["services", id] : ["services"]),
  projects: (id?: string) => (id ? ["projects", id] : ["projects"]),
  team: (slug?: string) => (slug ? ["team", slug] : ["team"]),
  testimonials: ["testimonials"] as const,

  // Sales
  orders: (id?: string, filters?: Record<string, unknown>) =>
    id ? ["orders", id] : filters ? ["orders", filters] : ["orders"],
  quotes: (id?: string) => (id ? ["quotes", id] : ["quotes"]),
  quoteRequests: ["quote-requests"] as const,

  // PM
  tasks: (id?: string) => (id ? ["tasks", id] : ["tasks"]),
  myTasks: ["tasks", "my"] as const,
  epics: ["epics"] as const,
  backlogs: ["backlogs"] as const,

  // System
  users: (id?: string) => (id ? ["users", id] : ["users"]),
  dashboard: ["dashboard"] as const,
};
```

---

## Common Patterns

### Fetch List with Filters + Pagination

```typescript
// hooks/useOrders.ts
import { useQuery } from "@tanstack/react-query";

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const { page = 1, limit = 20, status } = options;

  return useQuery({
    queryKey: ["orders", { page, limit, status }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(status && { status }),
      });

      const res = await fetch(`/api/admin/orders?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      return res.json() as Promise<{
        data: Order[];
        pagination: Pagination;
      }>;
    },
  });
}
```

### Fetch Single Item

```typescript
// hooks/useOrder.ts
import { useQuery } from "@tanstack/react-query";

export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch order");
      const { data } = await res.json();
      return data as Order;
    },
    enabled: !!id, // don't run if id is empty
  });
}
```

### Mutation (Create/Update/Delete)

```typescript
// hooks/useCreateOrder.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateOrderBody) => {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      return res.json();
    },

    onSuccess: () => {
      // Invalidate list query — forces refetch
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Or: queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
      toast.success("Tạo đơn hàng thành công!");
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
```

### Optimistic Update (Toggle Status)

```typescript
// hooks/useToggleOrderStatus.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useToggleOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/admin/orders/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Transition failed");
      return res.json();
    },

    // Optimistic: update cache immediately
    onMutate: async ({ id, status }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ["orders", id] });

      // Snapshot current value
      const previous = queryClient.getQueryData(["orders", id]);

      // Optimistically update
      queryClient.setQueryData(["orders", id], (old: Order) => ({
        ...old,
        status,
      }));

      return { previous };
    },

    onError: (_err, { id }, context) => {
      // Rollback on error
      queryClient.setQueryData(["orders", id], context?.previous);
      toast.error("Cập nhật thất bại");
    },

    onSettled: (_data, _err, { id }) => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
    },
  });
}
```

---

## Zustand — Client State

### Auth Store (client-side)

```typescript
// stores/auth-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  roles: string[];
  avatar: string | null;
  accountType: "staff" | "customer";
  teamMemberId: string | null;
  roleLevel: number;
  permissions: Array<{ resource: string; action: string; scope: string }>;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,

      setUser: (user) => set({ user, isLoading: false }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () => {
        set({ user: null, isLoading: false });
        // Also call POST /api/admin/auth/logout
      },
    }),
    {
      name: "loop-auth", // localStorage key
      partialize: (state) => ({ user: state.user }), // only persist user
    }
  )
);
```

### UI Store (modals, sidebar, etc.)

```typescript
// stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (key: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Theme
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Table selection
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  activeModal: null,
  modalData: null,
  openModal: (key, data = {}) => set({ activeModal: key, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  theme: "system",
  setTheme: (theme) => set({ theme }),

  selectedIds: [],
  toggleSelect: (id) =>
    set((s) => ({
      selectedIds: s.selectedIds.includes(id)
        ? s.selectedIds.filter((x) => x !== id)
        : [...s.selectedIds, id],
    })),
  clearSelection: () => set({ selectedIds: [] }),
  selectAll: (ids) => set({ selectedIds: ids }),
}));
```

### Usage in Component

```typescript
"use client";

import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useOrders } from "@/hooks/useOrders";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { Button } from "@/components/ui/button";

export function OrderList() {
  // Zustand — client state
  const { user } = useAuthStore();
  const { selectedIds, toggleSelect, clearSelection } = useUIStore();

  // TanStack Query — server state
  const { data, isLoading, error } = useOrders({ page: 1, status: "pending" });
  const createOrder = useCreateOrder();

  if (isLoading) return <OrderListSkeleton />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>Orders ({data?.pagination.total})</h1>
        <Button
          onClick={() => createOrder.mutate({ ... })}
          disabled={createOrder.isPending}
        >
          {createOrder.isPending ? "Creating..." : "Create Order"}
        </Button>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 p-2 bg-accent rounded">
          {selectedIds.length} selected
          <Button size="sm" variant="ghost" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {data?.data.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            selected={selectedIds.includes(order.id)}
            onSelect={() => toggleSelect(order.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Fetching Without TanStack Query (Simple Cases)

For one-off fetches or non-critical data:

```typescript
// Simple async function
async function fetchServices(): Promise<Service[]> {
  const res = await fetch("/api/services");
  if (!res.ok) throw new Error("Failed to fetch services");
  const { data } = await res.json();
  return data;
}

// Use in page or component
const data = await fetchServices();
```

For server components (no client JavaScript needed):
```typescript
// app/[locale]/services/page.tsx — Server Component
import { notFound } from "next/navigation";

export default async function ServicesPage() {
  const res = await fetch("https://api.example.com/services");
  if (!res.ok) notFound();
  const { data } = await res.json();

  return (
    <div>
      {data.map(service => (
        <ServiceCard key={service.id} service={service} />
      ))}
    </div>
  );
}
```

---

## Cache Invalidation Strategy

### On Create/Update/Delete → invalidate parent list

```typescript
// After creating an order, refresh the orders list
queryClient.invalidateQueries({ queryKey: ["orders"] });

// After updating a user, refresh user detail AND user list
queryClient.invalidateQueries({ queryKey: ["users", userId] });
queryClient.invalidateQueries({ queryKey: ["users"] });

// After status change, invalidate both detail and list
queryClient.invalidateQueries({ queryKey: ["tasks"] });
queryClient.invalidateQueries({ queryKey: ["tasks", taskId] });
```

### On Auth Change (login/logout) → clear all

```typescript
// After logout
const queryClient = useQueryClient();
queryClient.clear(); // removes all cached queries
```

### Prefetch (optional)

```typescript
// Prefetch next page on hover
const prefetchNextPage = async () => {
  await queryClient.prefetchQuery({
    queryKey: ["orders", { page: currentPage + 1 }],
    queryFn: () => fetchOrders(currentPage + 1),
  });
};
```

---

## Error Handling Patterns

```typescript
// Hook with error boundary support
export function useOrder(id: string) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        credentials: "include",
      });

      if (res.status === 401) {
        // Redirect to login
        window.location.href = "/vi/login";
        throw new Error("Unauthorized");
      }

      if (res.status === 403) {
        throw new Error("Bạn không có quyền truy cập");
      }

      if (res.status === 404) {
        throw new Error("Không tìm thấy đơn hàng");
      }

      if (!res.ok) {
        const { error, code } = await res.json();
        throw new Error(error ?? "Lỗi không xác định");
      }

      const { data } = await res.json();
      return data;
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.message === "Unauthorized") return false;
      return failureCount < 2;
    },
  });
}
```

---

## Folder Structure Recommended

```
src/
├── hooks/              # TanStack Query hooks (useOrders, useOrder, etc.)
│   ├── useOrders.ts
│   ├── useOrder.ts
│   ├── useCreateOrder.ts
│   └── ...
├── stores/             # Zustand stores
│   ├── auth-store.ts
│   └── ui-store.ts
├── lib/
│   ├── tanstack-query-provider.tsx
│   └── queries/
│       └── keys.ts     # queryKeys constants
└── app/
    ├── [locale]/
    │   └── ...
    └── admin/
        └── ...
```
