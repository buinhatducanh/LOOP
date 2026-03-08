import { ReactNode } from 'react';

// Since we have `[locale]/layout.tsx` and `admin/layout.tsx` containing html/body tags,
// this root layout is just a pass-through to satisfy Next.js requirements for global `not-found.tsx`.
export default function GlobalLayout({ children }: { children: ReactNode }) {
    return children;
}
