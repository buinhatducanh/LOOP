# /docs — Documentation Helper

Create or update documentation files in `docs/`.

**Usage:** `/docs [file]`

**What it does:**
1. Check if target doc exists
2. Create/update the doc with accurate, project-specific content
3. Link related docs

**Available docs to create:**
- `docs/API-CONTRACT.md` — full endpoint reference (PRIORITY)
- `docs/DATA-MODELS.md` — entity definitions from Prisma schema
- `docs/PERMISSION-MATRIX.md` — role × resource × action matrix
- `docs/ENV-VARIABLES.md` — all env vars with descriptions
- `docs/UI-COMPONENTS.md` — component library reference
- `docs/DESIGN-TOKENS.md` — design system tokens (colors, spacing, etc.)

**Priority:** Start with `API-CONTRACT.md` — this is blocking FE development.
