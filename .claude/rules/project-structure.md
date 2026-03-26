# Project Structure

## Directory Map

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Route Handlers
│   │   ├── admin/                # Protected admin API
│   │   ├── auth/                 # NextAuth OAuth
│   │   ├── webhooks/             # External webhooks
│   │   └── inngest/              # Background job handlers
│   ├── [locale]/                 # Public pages (vi/en)
│   │   ├── about/
│   │   ├── blog/[slug]/
│   │   ├── contact/
│   │   ├── portfolio/[id]/
│   │   ├── pricing/
│   │   ├── services/[id]/
│   │   └── team/[slug]/
│   └── admin/                    # Admin CMS (no locale)
│       ├── content/              # Services, Projects, Blog, Team
│       ├── sales/                # Orders, Quotes, Packages
│       ├── system/               # Users, Roles, Settings
│       └── projects/             # JIRA-like PM
├── components/
│   ├── ui/                       # Radix UI primitives + Tailwind
│   ├── admin/                    # Admin-specific components
│   ├── cards/                    # Card components (Pricing, Project, Service)
│   └── shared/                   # Shared (Navbar, Footer, HeroBanner)
├── lib/
│   ├── auth/                     # JWT, permissions, RBAC helpers
│   ├── api/                     # Response helpers (✅ done)
│   ├── prisma.ts                # DB singleton
│   └── utils.ts                 # cn(), format utilities
├── i18n/
│   ├── messages/                 # en.json, vi.json
│   ├── routing.ts
│   └── request.ts
└── styles/
    ├── index.css
    └── tailwind.css
```

## Where to Put Things

| Thing | Location |
|-------|---------|
| API Route Handler | `src/app/api/{path}/route.ts` |
| Admin Page | `src/app/admin/{section}/page.tsx` |
| Public Page | `src/app/[locale]/{section}/page.tsx` |
| Shared Component | `src/components/shared/` |
| Admin Component | `src/components/admin/` |
| Base UI | `src/components/ui/` |
| DB Logic | `src/lib/` or `prisma/` services |
| Auth Logic | `src/lib/auth/` |
| Types | `src/types/` |

## File Naming

- Route handlers: `route.ts` (Next.js convention)
- Server components: `*.tsx` or `*.ts` (no `"use client"`)
- Client components: `*.tsx` with `"use client"` at top
- Utils: `*.ts`, kebab-case for files with multiple exports
- Constants: `constants.ts` or `config.ts`

## Import Aliases

```typescript
// Use @/ for all local imports
import { ok } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
```

## No Circular Dependencies

Keep import direction one-way:
- `components/` → can import from `lib/`
- `lib/` → no imports from `components/` or `app/`
- `app/api/` → can import from `lib/`, no `components/`
