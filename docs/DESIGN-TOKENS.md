# Design Tokens

> **Source:** `src/styles/theme.css` (Tailwind v4) | **Updated:** 2026-03-26

---

## Color Palette

### Semantic Colors

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `background` | `#ffffff` | oklch(0.145) | Page background |
| `foreground` | oklch(0.145) | oklch(0.985) | Body text |
| `primary` | `#030213` | oklch(0.985) | Primary brand, buttons |
| `primary-foreground` | oklch(0.985) | oklch(0.205) | Text on primary |
| `secondary` | oklch(0.95) | oklch(0.269) | Secondary elements |
| `secondary-foreground` | `#030213` | oklch(0.985) | Text on secondary |
| `muted` | `#ececf0` | oklch(0.269) | Muted backgrounds |
| `muted-foreground` | `#717182` | oklch(0.708) | Secondary text |
| `accent` | `#e9ebef` | oklch(0.269) | Highlighted areas |
| `accent-foreground` | `#030213` | oklch(0.985) | Text on accent |
| `destructive` | `#d4183d` | oklch(0.396) | Errors, danger |
| `destructive-foreground` | `#ffffff` | oklch(0.637) | Text on destructive |
| `border` | `rgba(0,0,0,0.1)` | oklch(0.269) | Borders |
| `input` | `transparent` | oklch(0.269) | Input backgrounds |
| `input-background` | `#f3f3f5` | oklch(0.17) | Input fill |
| `card` | `#ffffff` | oklch(0.145) | Card backgrounds |
| `card-foreground` | oklch(0.145) | oklch(0.985) | Card text |
| `popover` | oklch(1) | oklch(0.145) | Popover backgrounds |
| `popover-foreground` | oklch(0.145) | oklch(0.985) | Popover text |
| `ring` | oklch(0.708) | oklch(0.439) | Focus ring |
| `switch-background` | `#cbced4` | oklch(0.35) | Switch off-state |

### Chart Colors

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `chart-1` | oklch(0.646 0.222 41.116) | oklch(0.488 0.243 264.376) |
| `chart-2` | oklch(0.6 0.118 184.704) | oklch(0.696 0.17 162.48) |
| `chart-3` | oklch(0.398 0.07 227.392) | oklch(0.769 0.188 70.08) |
| `chart-4` | oklch(0.828 0.189 84.429) | oklch(0.627 0.265 303.9) |
| `chart-5` | oklch(0.769 0.188 70.08) | oklch(0.645 0.246 16.439) |

### Sidebar Colors

| Token | Light | Dark |
|-------|-------|------|
| `sidebar` | oklch(0.985) | oklch(0.205) |
| `sidebar-foreground` | oklch(0.145) | oklch(0.985) |
| `sidebar-primary` | `#030213` | oklch(0.488 0.243 264.376) |
| `sidebar-primary-foreground` | oklch(0.985) | oklch(0.985) |
| `sidebar-accent` | oklch(0.97) | oklch(0.269) |
| `sidebar-accent-foreground` | oklch(0.205) | oklch(0.985) |
| `sidebar-border` | oklch(0.922) | oklch(0.269) |
| `sidebar-ring` | oklch(0.708) | oklch(0.439) |

---

## Typography

### Font Stack
- **Primary:** system-ui stack (system font for performance)
- **Vietnamese:** handled natively by system fonts + OS support

### Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| Base | 16px | 400 | Body text |
| h1 | ~2rem | 500 | Page titles |
| h2 | ~1.5rem | 500 | Section headers |
| h3 | ~1.25rem | 500 | Card titles |
| h4 | ~1rem | 500 | Sub-headers |
| Small | 0.875rem | — | Caption text |

Font size is controlled by `--font-size` CSS variable (default: `16px`).

### Role Colors (Admin badges)

| Role | Color Class |
|------|------------|
| ceo | `text-yellow-400 bg-yellow-500/15 border-yellow-500/30` |
| super_admin | `text-red-400 bg-red-500/15 border-red-500/30` |
| admin | `text-indigo-400 bg-indigo-500/15 border-indigo-500/30` |
| project_manager | `text-amber-400 bg-amber-500/15 border-amber-500/30` |
| media | `text-pink-400 bg-pink-500/15 border-pink-500/30` |
| qa | `text-cyan-400 bg-cyan-500/15 border-cyan-500/30` |
| member | `text-slate-400 bg-slate-500/15 border-slate-500/30` |

---

## Spacing & Radius

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius` | `0.625rem` (10px) | Base radius |
| `radius-sm` | `--radius - 4px` (6px) | Small elements |
| `radius-md` | `--radius - 2px` (8px) | Medium elements |
| `radius-lg` | `--radius` (10px) | Cards, dialogs |
| `radius-xl` | `--radius + 4px` (14px) | Large panels |

---

## Usage in Code

### Tailwind Classes

```html
<!-- Background -->
<div class="bg-background text-foreground" />

<!-- Primary brand -->
<button class="bg-primary text-primary-foreground">Button</button>

<!-- Danger/destructive -->
<button class="bg-destructive text-destructive-foreground">Delete</button>

<!-- Cards -->
<div class="bg-card text-card-foreground border border-border rounded-lg" />

<!-- Sidebar -->
<aside class="bg-sidebar text-sidebar-foreground" />

<!-- Focus ring -->
<input class="focus-visible:ring-ring" />

<!-- Muted text -->
<p class="text-muted-foreground" />
```

### CSS Variables (Raw)

```css
/* Read variable in custom CSS */
.my-component {
  background-color: var(--background);
  color: var(--foreground);
  border-color: var(--border);
  border-radius: var(--radius);
}

/* In JS */
const color = getComputedStyle(el).getPropertyValue('--primary');
```

### JSON Export

For FE framework integration (CSS-in-JS, design tools, etc.):

```json
{
  "colors": {
    "primary": { "light": "#030213", "dark": "#ffffff" },
    "destructive": { "light": "#d4183d", "dark": "oklch(0.396 0.141 25.723)" },
    "accent": { "light": "#e9ebef", "dark": "oklch(0.269 0 0)" }
  },
  "spacing": {
    "radius-sm": "calc(10px - 4px)",
    "radius-md": "calc(10px - 2px)",
    "radius-lg": "10px",
    "radius-xl": "calc(10px + 4px)"
  },
  "typography": {
    "fontSize": "16px",
    "fontWeight": { "normal": 400, "medium": 500 }
  }
}
```

---

## Animations

Uses **Framer Motion 11** for component animations. Standard patterns:

```typescript
// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// Fade in
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

// Slide up
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Standard transition
transition={{ duration: 0.2, ease: "easeOut" }}
```

Common animation durations:
- **Micro-interactions** (hover, click): 150-200ms
- **Page transitions**: 200-300ms
- **Modal/dialog open**: 200-300ms
- **List stagger**: 50ms between items
