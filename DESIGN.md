# Design

Visual system for the Clínica Dental Mª Cristina Sagarzazu site. Derived from the three real clinic photos (grey-blue walls, warm honey-wood floors, clean white furniture) so the identity preserves the real space. Aesthetic lane named: **"sala de espera luminosa"** — calm coastal-Basque domestic warmth, not corporate-dental-blue, not navy-and-gold, not cream-AI-default.

## Color

OKLCH throughout. Strategy: **Committed** — a calm grey-blue carries the surface, warmed by honey wood, on a true soft off-white that leans the brand hue (not warm-by-default cream).

```
--bg            oklch(0.985 0.004 230)   /* near-white, faint cool — like the clinic wall in daylight */
--surface       oklch(0.97 0.008 230)    /* raised panels */
--surface-warm  oklch(0.965 0.012 80)    /* warm wood-tinted panel for human sections */
--ink           oklch(0.26 0.03 240)     /* deep slate-blue, body text, 4.5:1+ on bg */
--ink-soft      oklch(0.42 0.03 240)     /* secondary text, still ≥4.5:1 on bg */
--brand         oklch(0.55 0.10 232)     /* the clinic blue — calm dental teal-blue, NOT saturated chain blue */
--brand-deep    oklch(0.40 0.09 235)     /* hovers, headings accents */
--brand-tint    oklch(0.93 0.03 230)     /* brand wash backgrounds */
--wood          oklch(0.66 0.09 64)      /* honey wood — warm accent, CTA glow, underlines */
--wood-deep     oklch(0.52 0.10 58)      /* wood accent text on light */
--mint          oklch(0.78 0.07 165)     /* fresh/clean micro-accent (sparingly: checkmarks, "limpieza") */
--line          oklch(0.90 0.01 230)     /* hairlines */
```

Contrast: `--ink` and `--ink-soft` both verified ≥4.5:1 on `--bg`/`--surface`. CTAs use `--brand-deep` text or white-on-`--brand`. Wood is accent only (underlines, glows, small fills), never body text on light unless `--wood-deep`.

## Typography

Self-hosted (woff2). Pairing on a contrast axis — warm careful serif + humanist grotesque. Both deliberately OFF the reflex-reject list.

- **Display / headings:** **Spectral** (Production Type) — a serif with calm, clinical-careful warmth; humane, readable, not Playfair-theatrical. Weights 300 (large display), 500/600 (section heads).
- **UI / body / labels:** **Bricolage Grotesque** — humanist grotesque with handmade character; "artesanal", friendly, not Inter/DM-neutral. Weights 400 (body), 500 (UI), 700 (emphasis/buttons).
- Numerals / small meta (phone, hours): Bricolage tabular, weight 500.

Scale: fluid `clamp()`, ratio ≈1.25. Display ceiling `clamp(2.6rem, 6vw, 5.5rem)` (≤6rem). Letter-spacing on display ≥ -0.025em. `text-wrap: balance` on h1–h3, `pretty` on prose. Body line-length 60–72ch. Line-height 1.65 body, 1.1 display.

## Layout
- Max content width 1200px; full-bleed hero/image bands break out.
- Fluid spacing scale via `clamp()`. Generous section separation (`clamp(5rem, 10vw, 9rem)` vertical), tight intra-group.
- **Symmetry rule (from brief):** every grid balances — no orphaned last row. Reviews use a balanced masonry that fills; services grid sized so rows are always complete; on mobile collapse to 1-col with "ver más".
- Asymmetric hero (text left / floating photo + organic blob right), symmetric content bands.
- Semantic z-scale: --z-base 1, --z-sticky 100, --z-header 200, --z-overlay 300, --z-modal 400, --z-loader 500, --z-toast 600.

## Components
- **Header:** sticky, slim, glass-free; logo (tooth + wordmark), nav links, language switcher (ES/EU/EN/FR flags-as-text), prominent "Pedir cita" CTA with wood glow.
- **Buttons:** primary = brand fill, white text, wood-glow on hover, label slides/transforms on hover (microinteraction). Secondary = outline brand. Min 44px.
- **Review card:** quote-led, real name, star row (animated draw on enter), Google "G" mark. Balanced grid.
- **Service item:** custom animated inline SVG icon (NOT emoji), title, one-line, real photo on hover/expand.
- **Footer:** clinic data, map, hours table, social, "© 2026 · Diseñado por unaxaller.com" linking to https://unaxaller.com.

## Motion
GSAP + ScrollTrigger. Lenis-style smooth feel optional. Principles: ease-out-expo/quint, no bounce. Page loader **only on first visit** (sessionStorage gate). Per-section reveals fit content (stagger lists, draw SVG strokes, count-up stats), never one uniform fade. Hero: ambient — gentle floating tooth/leaf SVGs + subtle parallax on mouse; background loop video (dental/calm, 60fps) behind a soft brand scrim. All gated by `prefers-reduced-motion` (instant final state). Mouse-reactive: hero parallax + CTA magnetic pull + cursor-follow soft glow on hero only.

## 50+ creative moves (impeccable inventory — to implement)
**Hero/identity:** 1 ambient looping background video behind brand scrim. 2 floating animated SVG molars + mint leaves with parallax. 3 cursor-follow soft light glow. 4 magnetic "Pedir cita" button. 5 hand-drawn underline that draws on load under the name. 6 first-visit page loader: a tooth SVG that "polishes" clean (sparkle) then lifts. 7 live "Abierto ahora / Cerrado" pill computed from real hours. 8 animated 4.8★ rating that draws stars on enter.
**Trust/reviews:** 9 marquee/carousel of real Google quotes, pausable. 10 stars draw-on stroke animation. 11 count-up: "87 reseñas", "4,8★", "+25 años". 12 keyword chips from real reviews (tratamiento·confianza·miedo·paciencia) that filter the wall. 13 "de toda la vida" generational timeline (Cristina → Marta). 14 Google "G" SVG mark, real. 15 balanced masonry, zero orphan rows.
**Services:** 16 each service = bespoke animated line-SVG (molar, brace/ortodoncia wire, implant screw, whitening sparkle, prótesis, limpieza water-drop). 17 SVG stroke draws on scroll into view. 18 hover reveals real treatment photo with soft mask wipe. 19 micro count of "+X tratamientos". 20 alternating image/text bands (symmetric).
**Clínica/about:** 21 photo gallery of the real space with parallax depth. 22 floating-plant motif echoing the waiting-room photos. 23 "miedo→tranquilidad" interactive slider/before-after of feeling. 24 team intro with soft portrait masks. 25 equipment/cleanliness highlights with mint accents.
**Navigation/feel:** 26 sticky header that shrinks on scroll. 27 scroll progress as a thin wood line. 28 smooth-scroll anchored nav. 29 language auto-detect by browser (never EU default). 30 active-section nav highlight.
**Microinteractions:** 31 buttons whose label transforms on hover. 32 tooltips on phone/email/hours. 33 inputs with floating labels + soft focus ring. 34 link underlines that wipe in. 35 cards lift with soft shadow + tilt toward cursor (subtle). 36 copy-to-clipboard on phone with toast. 37 form success state: tooth sparkle confirmation.
**Imagery/texture:** 38 organic blob masks (not rectangles) for portraits. 39 grain/soft-noise overlay for warmth. 40 SVG wavy section dividers (like a gum-line, subtle). 41 mint water-ripple on "limpieza". 42 4K calm imagery in quiet sections.
**Contact:** 43 embedded map with custom pin. 44 click-to-call big button. 45 WhatsApp (wa.me) action. 46 hours table with today highlighted live. 47 directions deep-link.
**Delight/system:** 48 custom 404: a lost/floating tooth, auto-redirect home. 49 reduced-motion full parity. 50 scroll-triggered section headers that "settle" into place. 51 favicon = clinic tooth logo. 52 dark-on-light only (daylight clinic), no dark mode toggle (calm, single world). 53 keyword-driven SEO copy woven into real review language. 54 FAQ with real-question schema. 55 per-language real translated pages.
