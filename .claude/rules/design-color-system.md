# Design Color System — Source of Truth

> **Version**: 3.0.0 · Updated: 2026-04-07
> **Source**: `src/lib/design-tokens.ts` + `public/assets/design-company/Bảng màu.png` + `color_1/2/3.png`
> **Status**: HOT PINK is the primary accent. Full palette extracted from Figma design files.

---

## Color Source Files

| File | Content |
|------|---------|
| `public/assets/design-company/Bảng màu.png` | Main palette overview |
| `public/assets/design-company/color_2.png` | Cosmic palette — deep blue cosmos |
| `public/assets/design-company/color_3.png` | Accent palette — vibrant accent colors |
| `public/assets/design-company/color_1.png` | Neutral gray scale |

---

## Primary Accent

> **Hot Pink `#EC4899`** is the primary accent color (2026-04-07).

| Token | Hex | Usage |
|-------|-----|-------|
| `DS.pink` | `#EC4899` | Primary accent, primary gradients, logo glow |
| `DS.pinkLight` | `#F472B6` | Gradient endpoints, hover states |

---

## Cosmic Palette (color_2.png — deep blue cosmos)

Primary cosmic colors:

| Token | Hex | Usage |
|-------|-----|-------|
| `DS.cosmicPurple` | `#6B3DF5` | Primary cosmic purple |
| `DS.cosmicBlue` | `#4F7DF3` | Primary cosmic blue |
| `DS.cosmicRed` | `#CC3344` | Cosmic red/magenta |
| `DS.cosmicCyan` | `#62C5EB` | Bright cosmic cyan |
| `DS.cosmicIndigo` | `#18387A` | Deep indigo navy |
| `DS.cosmicNavy` | `#143F72` | Deep navy blue |
| `DS.cosmicMagenta` | `#CF53B6` | Cosmic magenta |
| `DS.cosmicViolet` | `#5F3C99` | Cosmic violet |
| `DS.cosmicRose` | `#8E3577` | Cosmic rose |
| `DS.cosmicDeepMag` | `#6F265A` | Deep magenta |

Secondary cosmic tones:

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `DS.cosmicRoyalBlue` | `#2C61A0` | `DS.cosmicMedBlue` | `#3C63A9` |
| `DS.cosmicSkyBlue` | `#618FCA` | `DS.cosmicNavyMed` | `#174A8D` |
| `DS.cosmicPurpleMid` | `#6662B0` | `DS.cosmicPurpleLt` | `#2D2179` |
| `DS.cosmicIndigoLt` | `#291F75` | `DS.cosmicDeepBlue` | `#0F2753` |
| `DS.cosmicNavyBlue` | `#03234F` | `DS.cosmicTealBlue` | `#38529D` |
| `DS.cosmicMedIndigo` | `#343071` | `DS.cosmicLavender` | `#A571BC` |
| `DS.cosmicPinkLt` | `#A6689B` | | |

---

## Accent Palette (color_3.png — vibrant accent)

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `DS.gold` | `#E6C75F` | `DS.goldLight` | `#FFD700` |
| `DS.lavender` | `#B07CC6` | `DS.teal` | `#6EB1A8` |
| `DS.sky` | `#6E8EC0` | `DS.rose` | `#D77E8E` |
| `DS.mint` | `#7CB5A0` | `DS.navy` | `#7C6DAA` |
| `DS.blueAccent` | `#89A8C0` | | |

---

## Neutral Palette (color_1.png — gray scale)

| Token | Hex | Token | Hex |
|-------|-----|-------|-----|
| `DS.gray50` | `#FAFAFA` | `DS.gray300` | `#D4D4D8` |
| `DS.gray100` | `#F4F4F5` | `DS.gray400` | `#A1A1AA` |
| `DS.gray200` | `#E4E4E7` | `DS.gray500` | `#71717A` |
| `DS.gray600` | `#52525B` | `DS.gray700` | `#3F3F46` |
| `DS.gray800` | `#27272A` | `DS.gray900` | `#18181B` |

---

## GRD Gradients

```typescript
import { GRD } from "@/lib/design-tokens";
```

### Primary
| Token | Value |
|-------|-------|
| `GRD.primary` | `linear-gradient(135deg, #6B3DF5, #EC4899)` |
| `GRD.primaryHover` | `linear-gradient(135deg, #7B4FFF, #F472B6)` |
| `GRD.primaryPink` | `linear-gradient(135deg, #EC4899, #F472B6)` |

### Pink variants
| Token | Value |
|-------|-------|
| `GRD.pink` | `linear-gradient(135deg, #EC4899, #F472B6)` |
| `GRD.pinkCosmic` | `linear-gradient(135deg, #6B3DF5, #EC4899, #F472B6)` |
| `GRD.pinkGold` | `linear-gradient(135deg, #EC4899, #E6C75F)` |
| `GRD.pinkPurple` | `linear-gradient(135deg, #F472B6, #B07CC6)` |

### Cosmic
| Token | Value |
|-------|-------|
| `GRD.cosmic` | `linear-gradient(135deg, #6B3DF5, #CC3344)` |
| `GRD.cosmicBlue` | `linear-gradient(135deg, #4F7DF3, #6B3DF5)` |
| `GRD.cosmicPurple` | `linear-gradient(135deg, #6B3DF5, #5F3C99)` |
| `GRD.cosmicCyan` | `linear-gradient(135deg, #62C5EB, #4F7DF3)` |
| `GRD.cosmicMagenta` | `linear-gradient(135deg, #CF53B6, #6B3DF5)` |
| `GRD.cosmicNavy` | `linear-gradient(135deg, #143F72, #18387A)` |
| `GRD.cosmicRed` | `linear-gradient(135deg, #CC3344, #8E3577)` |

### Accent
| Token | Value |
|-------|-------|
| `GRD.accent` | `linear-gradient(135deg, #E6C75F, #B07CC6)` |
| `GRD.gold` | `linear-gradient(135deg, #E6C75F, #FFD700)` |
| `GRD.goldCosmic` | `linear-gradient(135deg, #E6C75F, #6B3DF5)` |
| `GRD.teal` | `linear-gradient(135deg, #6EB1A8, #7CB5A0)` |
| `GRD.tealCosmic` | `linear-gradient(135deg, #6EB1A8, #6B3DF5)` |
| `GRD.blue` | `linear-gradient(135deg, #4F7DF3, #6E8EC0)` |
| `GRD.blueCosmic` | `linear-gradient(135deg, #4F7DF3, #62C5EB)` |
| `GRD.purple` | `linear-gradient(135deg, #6B3DF5, #B07CC6)` |
| `GRD.purpleCosmic` | `linear-gradient(135deg, #5F3C99, #6B3DF5)` |
| `GRD.cyan` | `linear-gradient(135deg, #6EB1A8, #6B3DF5)` |
| `GRD.rose` | `linear-gradient(135deg, #D77E8E, #CF53B6)` |

### Background layers
| Token | Value |
|-------|-------|
| `GRD.cosmicBg1` | 3-color deep cosmic gradient |
| `GRD.cosmicBg2` | Magenta-tinted cosmic |
| `GRD.cosmicBg3` | Navy-tinted cosmic |
| `GRD.hero` | Subtle purple hero |
| `GRD.nav` | `rgba(12,12,20,0.90)` |
| `GRD.card` | `rgba(17,24,39,0.80)` |

---

## GLOW Shadows

```typescript
import { GLOW } from "@/lib/design-tokens";
```

### Primary glows
| Token | Value |
|-------|-------|
| `GLOW.pink` | `0 0 20px rgba(236,72,153,0.45)` |
| `GLOW.pinkStrong` | `0 0 30px rgba(236,72,153,0.55), 0 0 60px rgba(236,72,153,0.25)` |
| `GLOW.pinkCosmic` | `0 0 30px rgba(236,72,153,0.30), 0 0 60px rgba(107,61,245,0.15)` |

### Cosmic glows
| Token | Value |
|-------|-------|
| `GLOW.purple` | `0 0 20px rgba(107,61,245,0.45)` |
| `GLOW.purpleStrong` | `0 0 30px rgba(107,61,245,0.55), 0 0 60px rgba(107,61,245,0.25)` |
| `GLOW.blue` | `0 0 20px rgba(79,125,243,0.40)` |
| `GLOW.blueStrong` | `0 0 30px rgba(79,125,243,0.50), 0 0 60px rgba(79,125,243,0.25)` |
| `GLOW.cyan` | `0 0 20px rgba(98,197,235,0.45)` |
| `GLOW.cyanStrong` | `0 0 30px rgba(98,197,235,0.55), 0 0 60px rgba(98,197,235,0.25)` |
| `GLOW.magenta` | `0 0 20px rgba(207,83,182,0.45)` |
| `GLOW.cosmic` | `0 0 20px rgba(107,61,245,0.30), 0 0 40px rgba(79,125,243,0.15)` |
| `GLOW.cosmicFull` | Triple-layer cosmic glow |
| `GLOW.cosmicCyan` | Cyan + blue cosmic glow |

### Accent glows
| Token | Value |
|-------|-------|
| `GLOW.gold` | `0 0 20px rgba(230,199,95,0.35)` |
| `GLOW.goldStrong` | `0 0 30px rgba(230,199,95,0.50), 0 0 60px rgba(230,199,95,0.25)` |
| `GLOW.teal` | `0 0 20px rgba(110,177,168,0.40)` |
| `GLOW.lavender` | `0 0 20px rgba(176,124,198,0.40)` |
| `GLOW.rose` | `0 0 20px rgba(215,126,142,0.40)` |

### Layout glows
| Token | Value |
|-------|-------|
| `GLOW.cardShadow` | `0 8px 32px rgba(0,0,0,0.40)` |
| `GLOW.cardGlow` | `0 0 60px rgba(107,61,245,0.12)` |
| `GLOW.cardPinkGlow` | `0 0 60px rgba(236,72,153,0.12), 0 0 120px rgba(107,61,245,0.06)` |

---

## DS Colors (Quick Reference)

```typescript
import { DS } from "@/lib/design-tokens";
```

### Background
```
DS.bg          "#0C0C14"   Deep space
DS.bgCosmic    "#0C0C14"
DS.bgDeep      "#1A1A2E"
DS.bgCard      "#111827"
DS.bgCard3     "#0D1526"
```

### Primary Accent
```
DS.pink         "#EC4899"   PRIMARY ACCENT
DS.pinkLight    "#F472B6"
```

### Cosmic (blue cosmos)
```
DS.cosmicPurple   "#6B3DF5"
DS.cosmicBlue     "#4F7DF3"
DS.cosmicRed      "#CC3344"
DS.cosmicCyan     "#62C5EB"
DS.cosmicIndigo   "#18387A"
DS.cosmicNavy     "#143F72"
DS.cosmicMagenta  "#CF53B6"
DS.cosmicViolet   "#5F3C99"
```

### Accent
```
DS.gold       "#E6C75F"
DS.lavender   "#B07CC6"
DS.teal       "#6EB1A8"
DS.sky        "#6E8EC0"
DS.rose       "#D77E8E"
DS.mint       "#7CB5A0"
DS.navy       "#7C6DAA"
```

### Text
```
DS.text       "#FFFFFF"
DS.text2      "#E2E8F0"
DS.text3      "#B8C4D4"
DS.text4      "#7A8A9E"
DS.text5      "#5A6A7E"
```

### Legacy (mapped → cosmic/accent)
```
DS.blue       "#4F7DF3"   was #3B82F6
DS.purple     "#6B3DF5"   was #818CF8
DS.cyan       "#6EB1A8"   was #14B8A6
DS.green      "#7CB5A0"   was #22C55E
DS.amber      "#E6C75F"   was #F59E0B
DS.red        "#CC3344"   was #EF4444
```

---

## Gradient Heading Patterns

### Primary heading (cosmic purple → pink)
```tsx
<span style={{
  background: `linear-gradient(135deg, #FFFFFF 0%, #818CF8 40%, ${DS.pink} 70%, #3B82F6 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
}}>HEADING TEXT</span>
```

### Pink highlight heading
```tsx
<span style={{
  background: `linear-gradient(135deg, #FFFFFF 0%, ${DS.pink} 60%, ${DS.pinkLight} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
}}>HEADING TEXT</span>
```

### Blue → pink hero heading
```tsx
<span style={{
  background: `linear-gradient(135deg, ${DS.cosmicBlue}, ${DS.cosmicPurple} 30%, ${DS.pink} 60%, ${DS.cosmicCyan})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
}}>HEADING TEXT</span>
```

---

## Usage Rules

### DO ✅

- Use `DS.pink` / `DS.pinkLight` for all pink accent elements
- Use `GRD.primary` for primary CTA buttons
- Use `GLOW.pink` / `GLOW.pinkStrong` for pink neon effects
- Use `DS.cosmicCyan` (#62C5EB) for cyan highlights
- Use `DS.cosmicMagenta` (#CF53B6) for magenta accents
- Use cosmic background gradients (`GRD.cosmicBg1/2/3`) for section backgrounds
- Add cosmic glow (`GLOW.cosmicFull`) for premium cards

### NEVER ❌

- Hardcode `#EC4899` or `#F472B6` directly — use `DS.pink` / `DS.pinkLight`
- Hardcode `#818CF8` or `#6B3DF5` — use `DS.cosmicPurple` or `DS.purple`
- Hardcode `#4F7DF3` — use `DS.cosmicBlue` or `DS.blue`
- Use old indigo/violet hex codes (`#6366F1`, `#8B5CF6`) — use DS tokens
- Use `GRD.primary` for decorative backgrounds — use contextual GRD tokens

---

## hexRgba Helper

When creating semi-transparent overlays, use the inline helper:

```tsx
// From OnboardingClient.tsx
function hexRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Usage
hexRgba(DS.pink, 0.15)    // "rgba(236,72,153,0.15)"
hexRgba(DS.cosmicCyan, 0.2) // "rgba(98,197,235,0.2)"
```

---

## Files Using This System

| File | Usage |
|------|-------|
| `src/components/landing/OnboardingClient.tsx` | Logo glow, slides, CTAs |
| `src/app/[locale]/HomeClient.tsx` | Hero, sections |
| `src/app/[locale]/components/SiteHeader.tsx` | Border, nav |
| `src/app/[locale]/components/SiteFooter.tsx` | CTA gradient |
| `src/components/landing/ServicesClient.tsx` | Service cards |
| `src/components/landing/guild/TeamGuildClient.tsx` | Guild hero |
| `src/components/landing/guild/HallOfFame.tsx` | Holographic cards |
| `src/app/[locale]/khach-hang/page.tsx` | Dashboard cards |
| `src/lib/design-tokens.ts` | **Source of truth** |
