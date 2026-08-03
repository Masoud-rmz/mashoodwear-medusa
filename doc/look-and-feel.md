# look-and-feel.md — Mashhoodwear

> Visual identity for the Mashhoodwear storefront: colors, typography, spacing, motion, and layout rules.  
> **Site language:** English only (`lang="en"`, `dir="ltr"`). All UI copy, labels, placeholders, and helper text must be in English.  
> **Purchase channels:** Instagram Direct and Telegram only — no other checkout paths in phase 1.  
> **Companion docs:** `ui-behavior.md` (flows), `design.md` (technical).

---

## 1. Design System — Summary

```
+-----------------------------------------------------------------------------------+
|  TARGET: Mashhoodwear — RECOMMENDED DESIGN SYSTEM                                 |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  PATTERN: Hero-Centric + Storytelling-Driven                                      |
|     Emotional conversion through strong cultural identity                           |
|     Sections: Hero → New Arrivals → Brand Story → Footer                          |
|                                                                                   |
|  STYLE: Neubrutalism + Dark Mode (OLED)                                           |
|     Street, bold, anti-corporate, high contrast                                   |
|     Best For: Street brands, Gen Z, urban lifestyle, independent labels           |
|                                                                                   |
|  COLORS: Strict three-color palette — white / black / #330000 (Deep Maroon)       |
|  TYPOGRAPHY: Space Grotesk / Bebas Neue — bold and direct                         |
|                                                                                   |
|  AVOID: AI purple/pink gradients | Rounded soft UI | Pastel colors                |
|         Corporate serif fonts | Drop shadows everywhere | Fourth accent color     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Colors (Color Palette)

> **Strict brand rule:** The entire site uses exactly **three colors** — white, black, and `#330000`. No fourth colors (no green success, no yellow warning, no Instagram purple/pink gradient). Depth, hover, and shadows use **opacity** from these three colors only.

| Role | Code | Name |
|------|------|------|
| **Background** | `#000000` | Pure Black |
| **Surface / Card** | `rgba(255,255,255,0.04)` on black | Elevated Black |
| **Surface Elevated** | `rgba(255,255,255,0.07)` on black | Deeper Elevation |
| **Border** | `rgba(255,255,255,0.12)` | Subtle White Border |
| **Primary Accent** | `#330000` | Deep Maroon |
| **Primary Hover** | `#4D0000` (lighten accent with 10% white mix) | Maroon Hover |
| **Text Primary** | `#FFFFFF` | Pure White |
| **Text Secondary** | `rgba(255,255,255,0.62)` | Muted White |
| **Text Muted** | `rgba(255,255,255,0.35)` | Faint White |
| **Success** | `#FFFFFF` (+ ✓ icon) | No extra color — distinguished by icon |
| **Warning / Error** | `#661111` (lightened accent) (+ ⚠ icon) | Maroon Alert |
| **Destructive** | `#330000` | (same accent) |
| **Instagram CTA** | `#330000` solid (no official Instagram gradient) | Brand-consistent CTA |
| **Telegram CTA** | `#330000` solid (no official Telegram blue) | Brand-consistent CTA |

### CSS Variables

```css
:root {
  --color-bg: #000000;
  --color-surface: rgba(255,255,255,0.04);
  --color-surface-elevated: rgba(255,255,255,0.07);
  --color-border: rgba(255,255,255,0.12);
  --color-primary: #330000;
  --color-primary-hover: #4D0000;
  --color-text: #FFFFFF;
  --color-text-secondary: rgba(255,255,255,0.62);
  --color-text-muted: rgba(255,255,255,0.35);
  --color-success: #FFFFFF;      /* with ✓ icon — no extra color */
  --color-error: #661111;        /* Maroon Alert — with ⚠ icon */
  --color-destructive: #330000;
  --color-instagram-cta: #330000;
  --color-telegram-cta: #330000;
}
```

> **Note:** `--color-success` and `--color-error` are not a fourth palette color — both derive from the same three-color system (white and a lighter accent variant). These variables keep Toast, form, and status components consistent.

### Color Usage

- Main background is always pure `#000000`.
- Cards and surfaces **do not introduce new colors** — depth comes from transparent white layers (`rgba(255,255,255,0.04–0.08)`) on black.
- Only one accent color site-wide: `#330000`. Used for primary CTAs, special borders, active links, and error/warning states.
- The **Order on Instagram** button uses brand Primary style (maroon accent + Instagram icon) — never the official Instagram gradient.
- The **Order via Telegram** link/button uses the same Primary or Secondary style (maroon accent + Telegram icon) — never the official Telegram blue.
- Success is not shown in green; use white text with a check icon (✓). Errors/warnings use `#661111` with a warning icon (⚠), not bright yellow or red.
- Text on black must meet at least 4.5:1 contrast; white on pure black is ~21:1 (AAA).

---

## 3. Typography

### Fonts

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| **Display / Hero** | `Bebas Neue` | 400 | Large headlines, all caps |
| **Heading** | `Space Grotesk` | 700 | Page and section titles |
| **Body / UI** | `Space Grotesk` | 400–500 | Body copy, buttons, labels |
| **Mono / Price** | `Space Mono` | 700 | Prices, codes |

```css
/* Google Fonts — use font-display: swap to avoid FOIT */
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
```

> **Performance:** Prefer self-hosting woff2 font files to reduce CDN dependency. Always use `font-display: swap`.

### Type Scale

| Name | Size | Weight | Use |
|------|------|--------|-----|
| `hero` | `clamp(56px, 8vw, 96px)` | 400 | Bebas — Hero headline |
| `h1` | `clamp(32px, 5vw, 56px)` | 700 | Space Grotesk |
| `h2` | `32px` | 700 | Section titles |
| `h3` | `24px` | 600 | Card titles |
| `body-lg` | `18px` | 400 | Lead body text |
| `body` | `16px` | 400 | Default body |
| `caption` | `13px` | 500 | Labels, stock status |
| `price` | `22px` | 700 | Space Mono — price |

### Prices — no currency symbols

- No `$` or other currency symbols on product cards, detail, cart, checkout, or admin.
- Display numbers with **Western** thousand separators, e.g. `1,250,000`.
- **Cart and checkout:** append the word **Toman** after the amount, e.g. `1,250,000 Toman`.
- Product cards and detail page: Toman label optional.
- Price font: `Space Mono 700`, color `#FFFFFF` (or `#330000` only for strikethrough sale price).

---

## 4. Spacing

Mashhoodwear uses an 8px base spacing system.

| Variable | Value | Use |
|----------|-------|-----|
| `--space-1` | `4px` | Very tight gap |
| `--space-2` | `8px` | Small inner padding |
| `--space-3` | `12px` | Small card padding |
| `--space-4` | `16px` | Default gap |
| `--space-5` | `24px` | Card padding |
| `--space-6` | `32px` | Component spacing |
| `--space-7` | `48px` | Small section spacing |
| `--space-8` | `64px` | Major section spacing |
| `--space-9` | `96px` | Hero spacing |
| `--space-10` | `128px` | Large block spacing |

---

## 5. Border Radius

| Variable | Value | Use |
|----------|-------|-----|
| `--radius-sm` | `4px` | Labels, badges |
| `--radius-md` | `8px` | Buttons |
| `--radius-lg` | `12px` | Product cards |
| `--radius-xl` | `16px` | Modal, panel |
| `--radius-none` | `0px` | Special Neubrutalism style |

> In Neubrutalism, zero-radius (sharp) corners can look stronger than rounded ones. For featured cards, use `radius-none` with `border: 2px solid var(--color-primary)`.

---

## 6. Shadows

Neubrutalism uses hard offset shadows instead of soft blur shadows.

```css
/* Neubrutalism Shadows — brand three colors only */
--shadow-card:    4px 4px 0px #330000;
--shadow-button:  3px 3px 0px #330000;
--shadow-hover:   6px 6px 0px #4D0000;
--shadow-subtle:  0 1px 3px rgba(255,255,255,0.08);
--shadow-elevated: 0 8px 24px rgba(0,0,0,0.7);
```

---

## 7. Buttons

### Primary CTA
```
background: #330000  |  text: #FFFFFF  |  border: 2px solid #330000
hover → background: #4D0000 + translateY(-2px) + shadow-hover
font: Space Grotesk 600  |  letter-spacing: 0.08em  |  text-transform: uppercase
padding: 14px 28px  |  border-radius: 8px
```

### Secondary
```
background: transparent  |  text: #FFFFFF  |  border: 2px solid rgba(255,255,255,0.12)
hover → border-color: #FFFFFF
```

### Danger / Destructive
```
background: transparent  |  text: #FFFFFF  |  border: 2px solid #330000
hover → background: #330000
```

### Instagram CTA (hero + checkout)
```
Same style as Primary CTA — Instagram icon beside label text:
background: #330000  |  text: #FFFFFF  |  border: 2px solid #330000
hover → background: #4D0000 + translateY(-2px) + shadow-hover
font: Space Grotesk 600  |  letter-spacing: 0.08em  |  text-transform: uppercase
padding: 14px 28px  |  border-radius: 8px
label: "Order on Instagram" or "Complete Order on Instagram"
```
> No official Instagram gradient (purple→pink→orange) anywhere on the site. Visually identical to Primary CTA; only the Instagram icon differs.

### Telegram CTA (checkout fallback)
```
Secondary style with Telegram icon — smaller than Instagram primary on checkout:
background: transparent  |  text: #FFFFFF  |  border: 2px solid rgba(255,255,255,0.12)
hover → border-color: #FFFFFF
font: Space Grotesk 500  |  letter-spacing: 0.05em
label: "Or order via Telegram"
```
> No official Telegram blue. Telegram is the only other purchase channel besides Instagram.

### Disabled
```
opacity: 0.35  |  cursor: not-allowed  |  pointer-events: none
```

---

## 8. Product Cards

```
background: rgba(255,255,255,0.04) on black
border: 1px solid rgba(255,255,255,0.12)
border-radius: 12px
padding: 0 (full-bleed image) + 16px for content
overflow: hidden

hover:
  border-color: #330000
  box-shadow: 4px 4px 0px #330000
  transform: translateY(-3px)
  transition: all 200ms ease

image:
  aspect-ratio: 3/4 (portrait for apparel)
  object-fit: cover
  transition: transform 300ms ease
  hover → scale(1.04)

stock label on card (Products grid + Collection detail only — not on home New Arrivals):
  font: Space Mono 11px uppercase
  margin-top: 4px
  In stock → color var(--color-text-muted)
  Sold out → color var(--color-text-muted) at opacity 0.5 (no #888 — stay in 3-color palette)
  Only N left → color var(--color-primary) #330000
```

---

## 8-A. Brand Collection Cards (`/collections`)

Same hover/border treatment as product cards (§8). Differences:

```
image: aspect-ratio 4/5 (slightly wider than product card)
title: Bebas Neue, 22px, uppercase
subtitle: Space Grotesk 13px — "N pieces" from productCount
no price on collection card
```

---

## 8-B. Products Filter Sidebar & Price Range

Desktop: sticky sidebar (`260px`) left of product grid. Mobile: same controls in bottom sheet (§14).

Sidebar sticky offset: below header — `top: ~96px` production; preview uses `top: 152px` (includes 40px dev toolbar).

**Filter groups (order):** Category (checkboxes) → Size (toggle buttons, 3-col grid) → Color (swatches) → Price range (dual slider).

**Price range dual slider** *(production build — not in static preview yet)*:

```
filter-label: "Price range"
dual range inputs or custom slider on min/max product price (Toman, no symbol)
track: rgba(255,255,255,0.12) | fill: #330000
thumb: 16px circle, border 2px #FFFFFF, background #330000
shows selected range as text below e.g. "500,000 – 2,500,000"
maps to API minPrice / maxPrice query params
```

**Clear filters:** full-width secondary button below all groups.

**Color swatches (filter + product detail):** 32px circles; `.active` gets white border + scale(1.1). Swatch fill colors (gray `#6b6b6b`, blue `#1e3a5f`, etc.) are **UI identification only** — not part of the three-color brand palette. Preview shows all 8 swatches on product detail; production shows only variant colors for that product.

**Preview note:** `preview/full-site.html` implements category, size, and color only (client-side). Price slider and search API ship in production React build.

---

## 9. Motion & Transitions

| Name | Value | Use |
|------|-------|-----|
| `--duration-fast` | `150ms` | Button hover |
| `--duration-base` | `200ms` | Card transitions |
| `--duration-slow` | `300ms` | Page entry |
| `--duration-xslow` | `500ms` | Slider, modal |
| `--ease` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Default |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Add to cart |

### Motion Rules

- No animation longer than 500ms.
- Element entry starts with `fade-in + translateY(12px)`.
- Success toast: slide in from top-right, **2–3 seconds**, slide out — or dismiss on tap ("OK").
- Respect `prefers-reduced-motion: reduce` — all animations (scroll reveal, card entry, hero video, hover transform) are **fully disabled**, not just slowed; elements render in their final state immediately.

---

## 10. Icons

- Use **Lucide Icons** or **Heroicons**. No emoji as icons.
- Default size: `20px`
- stroke-width: `1.5`
- Color: `currentColor` to match surrounding text.

---

## 11. Header & Navigation

```
position: sticky (top: 0 in production)
background: rgba(0, 0, 0, 0.92)
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(255,255,255,0.12)
height: 64px
padding: 0 24px
z-index: 100

Preview only: when dev toolbar is present, header uses top: 40px (toolbar height).
Hero min-height in preview: calc(100vh - 104px) = toolbar + header.
Production: header top: 0; hero min-height calc(100vh - 64px).

Logo: image file (PNG/SVG, transparent background, uploaded via admin Settings) — not styled text
  max-height: 32px–40px (header) / ~24px (footer) | width: auto | object-fit: contain
  placed at start of header (left in LTR layout)
  click logo → return to home
  hover zoom: image scales 1 → 1.08 on hover, returns to 1 on mouse leave
    transition: transform var(--duration-fast) var(--ease)
  fallback (image load error): text "MASHHOOD" | Bebas Neue | same hover zoom behavior
nav: Space Grotesk 14px | uppercase | letter-spacing: 0.1em
Nav items: Home | Collections | Products | Lookbook | About | Contact
Nav hover: color → #330000 | transition 150ms
Header right: cart icon + hamburger (mobile only) — no Order on Instagram button in header
Mobile: hamburger menu | closes with Escape
```

---

## 11-A. Home Page — Hero Section

Defines the visual behavior of the home hero — complements user flow §4.1 in `ui-behavior.md`.

### Layout

```
.hero { display: grid; grid-template-columns: 0.95fr 1.05fr; min-height: calc(100vh - 64px); }

Left column (text) — fully left-aligned (text-align: left):
  - optional eyebrow (.hero-eyebrow): 13px, uppercase, letter-spacing 0.2em, color var(--color-text-muted)
    default copy: "Independent streetwear" | hidden when admin clears hero_eyebrow
  - main headline (t-hero / Bebas Neue) — left-aligned, never centered
    accent words STREETS and FEW: color #330000 with white text-stroke
    line two: hard-offset text-shadow 5px 5px 0 #330000 (Neubrutalism)
  - subtitle (hero-subtitle) — left-aligned, max-width: 480px
  - CTAs: **View Products**, **Order on Instagram** — left-aligned row
  - padding: var(--space-9) var(--space-7)

Right column (model images):
  - flex row, nowrap — two slots side by side, equal width (50% each minus gap)
  - gap: 12px between slots
  - each slot: aspect-ratio 3/4, border-radius: var(--radius-lg), border: 2px solid rgba(255,255,255,0.12)
  - empty placeholder: background rgba(255,255,255,0.04) + image icon + "Model image 1" / "Model image 2"
  - when real photo uploaded: object-fit: cover, no forced face crop
  - no vertical offset between slots — aligned top

Mobile (≤768px):
  - grid-template-columns: 1fr (single column)
  - order: text first, then two images still side by side (flex row)
  - text stays left-aligned
```

### Hero Background — Two Modes

Hero has exactly two modes; only one is active at a time:

**1) Default — Minimal (recommended):**
```
background: #000000 base
overlay (::before pseudo-element):
  radial-gradient ellipse at top-right: rgba(51,0,0,0.2) → transparent
  radial-gradient ellipse at bottom-left: rgba(51,0,0,0.1) → transparent
  linear-gradient fade at bottom edge: rgba(51,0,0,0.18) → transparent
```
Subtle maroon fade on pure black — not a solid maroon wash. Lightweight, fast, no extra data on mobile.

**2) Advanced — Video (optional, toggled in admin):**
- Video: `autoplay muted loop playsinline`, no playback controls, `object-fit: cover` over full hero height.
- Dark overlay always on video (`background: rgba(0,0,0,0.55)` or gradient like Minimal) so white text stays readable.
- On mobile or slow connection, show poster image instead of video.
- `prefers-reduced-motion: reduce` stops video and shows Minimal equivalent (static image).
- If video is unset or disabled, fall back to mode 1 immediately — no intermediate or visible error state.

### Scroll Reveal

- Sections below hero (New Arrivals, Brand Story, Footer) fade in on viewport entry:
  `opacity: 0 → 1` + `translateY(24px) → 0`, duration `--duration-slow (300ms)`, easing `--ease`.
- Implement with `IntersectionObserver` (not raw scroll events) — each section animates once.
- Product cards in New Arrivals stagger ~50–80ms between cards.
- Per motion rules (§9), no animation exceeds 500ms; `prefers-reduced-motion` disables all effects.

### Decorative logo background (optional)

Subtle watermark marks behind page content — implemented in `preview/shared.css`:

```
.logo-bg: position absolute, full viewport, pointer-events none, z-index 0
.logo-bg__mark: faded logo image (~12–15% opacity), varied size/rotation
scroll parallax on marks (disabled when prefers-reduced-motion)
main content and header sit above (z-index > 0)
```

Production: optional; include if it matches brand preview unless performance review says otherwise.

---

## 11-B. About Page — CMS Story Layout

Complements About user flow §4.6 in `ui-behavior.md`. Applies to `/about` and the same `.cms-page` pattern for other CMS pages unless noted.

### Page shell

```
.cms-page { max-width: 800px; padding: var(--space-7) 0 var(--space-8); }
.cms-page--about { max-width: 960px; }   /* wider for values grid on desktop */

page-title (h1): Space Grotesk 700 | clamp(32px, 5vw, 48px) | #FFFFFF | margin-bottom: var(--space-4)
```

### Tagline (first line / lead)

Rendered from the opening paragraph or a dedicated `.about-tagline` when the first line is all-caps Bebas-style copy:

```
font: Bebas Neue 400
font-size: clamp(28px, 4vw, 40px)
letter-spacing: 0.06em
color: #330000
text-transform: uppercase
margin-bottom: var(--space-5)
line-height: 1.1
```

Default copy: **NOT MADE TO FOLLOW. MADE TO LEAD.** (CMS may store sentence case; `.about-tagline` uses `text-transform: uppercase`.)

### Body typography

```
.cms-body:
  font: Space Grotesk 400
  font-size: 18px (body-lg)
  color: rgba(255,255,255,0.62)
  line-height: 1.65
  gap between blocks: var(--space-4)

.cms-body p strong, .cms-body .about-closing:
  color: #FFFFFF

.cms-body h2:
  font: Bebas Neue 400
  font-size: 32px
  letter-spacing: 0.08em
  color: #FFFFFF
  text-transform: uppercase
  margin-top: var(--space-7)
  margin-bottom: var(--space-5)

.cms-body h3:
  font: Space Grotesk 700
  font-size: 18px
  letter-spacing: 0.1em
  text-transform: uppercase
  color: #FFFFFF
  margin-top: var(--space-5)
  margin-bottom: var(--space-2)

.cms-body hr, .cms-divider:
  border: none
  height: 1px
  background: rgba(255,255,255,0.12)
  margin: var(--space-7) 0
```

### Values block (OUR VALUES)

On desktop, the three value items (STREET CULTURE · HIP-HOP CULTURE · BROTHERHOOD) render in a **3-column grid**; mobile stacks to 1 column.

```
.values-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);
}
@media (min-width: 769px) {
  .values-grid { grid-template-columns: repeat(3, 1fr); }
}

.value-card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(51,0,0,0.45);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  animation: burn-glow 0.85s ease-in-out infinite alternate;
  transition: transform var(--duration-base) var(--ease);
}
.value-card__fire { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; border-radius: inherit; }
.value-card__inner { position: relative; z-index: 2; }
.value-card::after {
  content: "";
  position: absolute; inset: auto 0 0 0; height: 58%; z-index: 1; pointer-events: none; border-radius: inherit;
  background: linear-gradient(to top, rgba(51,0,0,0.72) 0%, rgba(102,17,17,0.35) 38%, rgba(77,0,0,0.12) 62%, transparent 100%);
  opacity: 0.88;
}
.flame {
  position: absolute; bottom: -8%; width: 34%; height: 52%;
  border-radius: 50% 50% 18% 18%;
  background: radial-gradient(ellipse 80% 100% at 50% 100%, rgba(255,255,255,0.22) 0%, rgba(102,17,17,0.95) 22%, rgba(77,0,0,0.75) 48%, rgba(51,0,0,0.2) 72%, transparent 100%);
  filter: blur(1px); opacity: 0.9; transform-origin: 50% 100%;
}
.flame--1 { left: 4%; animation: flame-dance 0.55s ease-in-out infinite alternate; }
.flame--2 { left: 30%; width: 38%; height: 58%; animation: flame-dance 0.7s ease-in-out infinite alternate-reverse; animation-delay: 0.12s; }
.flame--3 { right: 8%; width: 32%; animation: flame-dance 0.62s ease-in-out infinite alternate; animation-delay: 0.22s; }
.flame--4 { left: 52%; width: 22%; height: 40%; filter: blur(2px); animation: flame-dance 0.48s ease-in-out infinite alternate-reverse; animation-delay: 0.08s; }
.ember {
  position: absolute; bottom: 18%; width: 3px; height: 3px; border-radius: 50%;
  background: rgba(255,255,255,0.85); box-shadow: 0 0 6px rgba(102,17,17,0.9);
  animation: ember-float 1.1s ease-out infinite;
}
.ember--1 { left: 22%; } .ember--2 { left: 58%; animation-delay: 0.35s; } .ember--3 { right: 20%; animation-delay: 0.65s; }
.value-card h3 { margin-top: 0; color: #FFFFFF; text-shadow: 0 0 10px rgba(102,17,17,0.75); }
.value-card p { margin: 0; font-size: 16px; }

/* Fire / burn — always on (no hover required). Palette: #330000, #4D0000, #661111 + white core only */
.value-card:hover { transform: translateY(-2px); }

@keyframes flame-dance {
  0% { transform: translateY(0) scaleX(1) scaleY(1) rotate(-3deg); }
  50% { transform: translateY(-6px) scaleX(1.08) scaleY(1.12) rotate(2deg); }
  100% { transform: translateY(-10px) scaleX(0.95) scaleY(1.18) rotate(-1deg); }
}
@keyframes ember-float {
  0% { transform: translateY(0) scale(1); opacity: 0.9; }
  70% { opacity: 0.5; }
  100% { transform: translateY(-28px) scale(0.4); opacity: 0; }
}
@keyframes burn-glow {
  0% { box-shadow: 0 0 10px rgba(102,17,17,0.45), 0 -4px 18px rgba(51,0,0,0.55), 4px 4px 0 #330000; }
  100% { box-shadow: 0 0 22px rgba(102,17,17,0.75), 0 -10px 32px rgba(77,0,0,0.85), 6px 6px 0 #4D0000; }
}

@media (prefers-reduced-motion: reduce) {
  .value-card, .value-card:hover { transform: none; transition: none; animation: none; box-shadow: 4px 4px 0 #330000; border-color: rgba(255,255,255,0.12); }
  .value-card::after { opacity: 0; }
  .value-card .flame, .value-card .ember { opacity: 0; animation: none; }
  .value-card h3 { text-shadow: none; color: #FFFFFF; }
}
```

> **Implementation:** Markdown seed uses `###` headings for value titles. Frontend MAY map the three h3 blocks under **OUR VALUES** into `.values-grid` / `.value-card` on render, or ship a static About template with the default copy from `ui-behavior.md` §4.6.

### Closing line

**Welcome to MASHOOD** — bold white, extra top margin `var(--space-6)`, optional subtle maroon left border `3px solid #330000` + padding-left `var(--space-4)`.

### Motion

Same scroll-reveal as home sections (fade + `translateY(12px)`), once per section block; disabled when `prefers-reduced-motion: reduce`.

---

## 12. Forms & Inputs (Admin Panel)

```
input/textarea:
  background: rgba(255,255,255,0.04)
  border: 1px solid rgba(255,255,255,0.12)
  border-radius: 8px
  padding: 12px 16px
  color: #FFFFFF
  font: Space Grotesk 16px

  focus → border-color: #330000 + outline: none
  error → border-color: #661111 + helper text in #661111
  placeholder → color: rgba(255,255,255,0.35)

label: Space Grotesk 13px | rgba(255,255,255,0.62) | margin-bottom: 6px
error message: 12px | #661111 | with ⚠ icon
```

---

## 13. Loading Skeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255,255,255,0.04) 25%,
    rgba(255,255,255,0.09) 50%,
    rgba(255,255,255,0.04) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## 14. 404 & Empty States

```
background: page default
minimal icon/image: 64px–96px | outline style, single color rgba(255,255,255,0.35) or #330000
  from Lucide/Heroicons set (no emoji, no complex colored images)
  examples: empty cart → shopping-bag icon | no search results → search-x icon
primary text: H2 in Space Grotesk | color: #FFFFFF
secondary text: 16px | color: rgba(255,255,255,0.62)
button: Primary CTA
spacing: space-9 top and bottom | space-4 between icon and text
```

### Mobile Filter Panel — Bottom Sheet

```
position: fixed | bottom: 0 | left: 0 | right: 0
background: #000000 | border-top: 1px solid rgba(255,255,255,0.12)
border-radius: var(--radius-xl) var(--radius-xl) 0 0
max-height: 85vh | overflow-y: auto
drag handle at top: 40px × 4px | rgba(255,255,255,0.35) | border-radius: 2px
overlay behind panel: rgba(0,0,0,0.6)
entry: slide-up from bottom | --duration-base (200ms) | --ease
"Apply filters" button sticky at bottom | Primary CTA style
```

---

## 15. Footer

```
background: #000000
border-top: 1px solid rgba(255,255,255,0.12)
padding: 48px 24px 24px

layout: .footer-grid — 3 columns desktop, stack on mobile
  column 1: logo (image or MASHOOD fallback) + tagline (14px muted)
    default tagline: "Independent streetwear. Clothing isn't just coverage — it's how you show who you are."
  column 2 — Shop: Collections, Products, Lookbook, How to Buy
  column 3 — Info: About, Contact

.footer-bottom: copyright (12px muted) + social links (Instagram, Telegram)

logo: same image file (smaller, ~24px height) | hover: transform: scale(1.08) with transition var(--duration-fast)
links: 14px | rgba(255,255,255,0.62) | hover → #FFFFFF
social links: Instagram + Telegram only (purchase channels)
```

---

## 16. Pre-Delivery Checklist

Before shipping any page:

- [ ] No emoji used as icons
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover state with transition on all buttons and cards
- [ ] Text contrast at least 4.5:1 (WCAG AA)
- [ ] Visible keyboard focus state
- [ ] `prefers-reduced-motion` respected (disables hero video and scroll animations)
- [ ] Responsive at 375px / 768px / 1024px / 1440px
- [ ] `aria-label` on icon-only buttons
- [ ] Images have `alt` text
- [ ] No fourth color outside white/black/#330000 (no green, yellow, or Instagram gradient)
- [ ] All UI copy in English
- [ ] Skeleton loading implemented
- [ ] Error messages in plain English with icon
- [ ] No prices with `$` or currency symbols
- [ ] Header and footer logos are image files (not styled text)
- [ ] Hero video has poster/static fallback for mobile and slow connections
- [ ] Hero default is Minimal (no video); video only when admin enables it
- [ ] "Copy order details for DM" button on checkout page
- [ ] "Toman" label on cart and checkout totals
- [ ] Checkout offers Instagram (primary) and Telegram (secondary) only — no other purchase links
- [ ] Mobile filters implemented as bottom sheet (not top drawer)
- [ ] Empty states include minimal icon/image, not text only
- [ ] Fonts self-hosted or `font-display: swap` on Google Fonts import
- [ ] `prefers-reduced-motion` fully disables animations (not just slows them)

---

## 17. Accessibility

Complements §9 in `ui-behavior.md` with visual specifics.

- **Color contrast:** Primary text `#FFFFFF` on `#000000` — ~21:1 (AAA). Secondary `rgba(255,255,255,0.62)` on `#000000` — sufficient for AA. Accent `#330000` is for emphasis, borders, and button backgrounds only — not body text on black (insufficient contrast). For errors/warnings, use white text on `#330000`/`#661111` background with icon, not maroon text on black.
- **Focus state:** `outline: 2px solid #330000 | outline-offset: 2px` — all interactive elements.
- **Disabled state:** `opacity: 0.35` — dimmer than default with explanatory tooltip (e.g. "Pick a size first").
- **Error messages:** `#661111` color (or white text on `#330000` background) with ⚠ icon — not color alone.
- **Hamburger menu:** closes on Escape key.

---

## 18. Breakpoints (Responsive)

Aligned with `ui-behavior.md` §10:

| Name | Range | Main changes |
|------|-------|--------------|
| **Mobile** | `≤ 768px` | Nav → hamburger \| product grid → 1 column \| filters → bottom sheet \| buttons → full width \| forms → single column |
| **Tablet** | `769px – 1024px` | Compact horizontal nav \| product grid → 2 columns \| filters → sidebar or drawer |
| **Desktop** | `≥ 1025px` | Full layout \| grid → 3 columns \| fixed sidebar filters |

> Test responsiveness at: `375px / 768px / 1024px / 1440px`

---

> **Note:** This file defines visual identity only. User flows → `ui-behavior.md`. Technical spec → `design.md`. All UI copy is English. Purchase channels: Instagram Direct + Telegram only.
