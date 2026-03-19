import { ReactNode } from 'react';

// Root layout is a pass-through — html/body live in [locale]/layout.tsx
// This allows not-found.tsx (rendered outside [locale]) to still have valid html/body
export default function GlobalLayout({ children }: { children: ReactNode }) {
    return children;
}
