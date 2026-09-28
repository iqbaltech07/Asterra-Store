# Asterra Store ΓÇö Design System

> **Purpose:** Source of truth for the visual language, interaction behavior, responsive rules, and implementation guardrails for Asterra Store.
>
> **Product:** Premium digital-app store focused on discovery, trust, fast purchasing, and a polished checkout experience.

---

## 01. Design Direction

### Core idea
Asterra should feel like a **curated digital boutique**, not a generic SaaS dashboard and not a template marketplace.

The visual language combines:

- **Editorial commerce** ΓÇö strong typography, intentional composition, curated content hierarchy.
- **Quiet technology** ΓÇö modern UI details without neon, holographic, or sci-fi gimmicks.
- **Premium utility** ΓÇö users should instantly understand what is sold, why it is useful, and how to buy it.
- **Controlled personality** ΓÇö distinctive enough to be memorable, restrained enough to remain trustworthy.

### Emotional target

Asterra should communicate:

**Curated ΓåÆ Premium ΓåÆ Clear ΓåÆ Fast ΓåÆ Trustworthy**

It should *not* communicate:

**Cheap ΓåÆ Over-designed ΓåÆ Generic AI SaaS ΓåÆ Crypto/cyberpunk ΓåÆ Corporate banking dashboard**

### Visual personality

- High visual density, but with deliberate spacing.
- Asymmetry is encouraged when it improves hierarchy.
- Large typography is allowed and preferred for key moments.
- Use surfaces sparingly; avoid turning every section into a floating card.
- Prefer borders, typography, spacing, and image composition over heavy shadows.
- Rounded corners should feel structural, not decorative.
- Avoid visual effects that exist only to make the UI look "AI-generated".

---

## 02. Anti-AI-Slop Rules

These rules are mandatory.

### Never default to

- Purple/blue gradients.
- Glassmorphism everywhere.
- Glowing borders.
- Excessive blur.
- Huge centered hero with generic copy and three floating cards.
- Repeated rounded cards with identical layout.
- Tiny pill badges for every attribute.
- Random abstract blobs.
- Fake 3D objects used as decoration.
- Excessive stars, sparkles, particles, or "AI magic" visuals.
- Gradient text as a substitute for good typography.
- Giant corner radii on every element.
- Dashboard layouts that make a simple store feel like enterprise software.
- Excessive use of icons where normal text is clearer.

### Prefer instead

- Strong typographic contrast.
- Editorial grids.
- Cropped product artwork.
- Intentional negative space.
- Thin borders.
- Offset compositions.
- Horizontal product rails.
- Strong image-to-copy proportions.
- One memorable visual idea per section.
- Subtle micro-interactions.
- Real product information over decorative filler.

### Design test

Remove the colors and decoration mentally.

If the page is still visually interesting because of **composition, type, spacing, and hierarchy**, the design is working.

If it becomes a collection of rounded boxes, the design is failing.

---

## 03. Color System

Asterra uses a warm-neutral foundation with a restrained copper-orange accent.

### Primary palette

```css
--color-bg: #F7F5F0;
--color-surface: #FCFBF8;
--color-surface-raised: #FFFFFF;
--color-ink: #171A18;
--color-ink-soft: #303633;
--color-muted: #707874;
--color-border: #D9DDD8;
--color-border-strong: #B9BFBB;
--color-accent: #C66543;
--color-accent-dark: #A94F32;
--color-accent-soft: #F1DFD7;
```

### Semantic colors

```css
--color-success: #2F6B4F;
--color-warning: #A56A21;
--color-danger: #B4433A;
--color-info: #486875;
```

### Rules

- Accent color is for **actions, emphasis, selected states, links, and key highlights**.
- Do not use accent on every component.
- Background should remain predominantly neutral.
- Avoid gradients unless a future brand decision explicitly introduces one.
- Never use pure black for large text areas; use `--color-ink`.

---

## 04. Typography

### Typeface direction

Use a modern grotesk/sans-serif with strong numerals and excellent small-size readability.

Recommended stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

A display font can be introduced later for selected hero moments, but only if it creates a genuine brand distinction. Never pair random trendy fonts just for visual novelty.

### Type scale

| Token | Size | Line height | Usage |
|---|---:|---:|---|
| Display XL | 64px | 0.98 | Major campaign/hero headline |
| Display L | 52px | 1.02 | Primary page headline |
| Display M | 40px | 1.05 | Section headline |
| Heading L | 32px | 1.10 | Large content heading |
| Heading M | 24px | 1.15 | Product/category heading |
| Heading S | 20px | 1.20 | Card/product heading |
| Body L | 18px | 1.55 | Supporting copy |
| Body M | 16px | 1.50 | Default UI/body |
| Body S | 14px | 1.45 | Metadata |
| Caption | 12px | 1.35 | Fine print |

### Typography rules

- Use weight and size to establish hierarchy, not all-caps badges.
- Headlines should be short and specific.
- Avoid long paragraphs above the fold.
- Do not center-align everything.
- Product names should remain visually dominant over metadata.
- Price typography should be easy to scan in under one second.

---

## 05. Layout System

### Container

```css
--container-max: 1280px;
--gutter-desktop: 32px;
--gutter-tablet: 24px;
--gutter-mobile: 16px;
```

Main content should generally use a centered max-width container.

### Grid

Desktop:

- 12-column grid.
- 20ΓÇô24px gutters.
- Prefer asymmetric compositions such as `7 / 5`, `8 / 4`, or `5 / 7` when appropriate.

Tablet:

- 8-column logical grid.
- Reduce composition complexity rather than merely shrinking desktop.

Mobile:

- 4-column logical grid.
- Use edge-to-edge media when useful.
- Preserve horizontal rhythm and hierarchy.

### Section spacing

```css
--space-section-xl: 120px;
--space-section-lg: 88px;
--space-section-md: 64px;
--space-section-sm: 40px;
```

Do not make every section the same height. Rhythm should feel editorial rather than templated.

---

## 06. Corner Radius & Elevation

### Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 18px;
--radius-xl: 24px;
```

### Rules

- Default interactive controls: `8ΓÇô12px`.
- Product media blocks: `12ΓÇô18px`.
- Large feature surfaces: up to `24px`.
- Avoid `9999px` pill shapes except for genuinely compact status indicators.

### Shadows

Use shadows only when elevation communicates interaction or hierarchy.

Preferred:

```css
box-shadow: 0 8px 30px rgba(23, 26, 24, 0.07);
```

Avoid stacked shadows and floating-card soup.

---

## 07. Navigation

### Desktop

The header should be compact and confident.

Recommended structure:

```text
[ASTER[A]]    Discover   Categories   Deals                  Search   Cart   Account
```

The logo should remain visually simple. Avoid unnecessary logo containers or badges.

### Mobile

Use:

```text
[Menu]   [ASTER[A]]   [Cart]
```

Secondary navigation can appear in an expandable drawer or bottom navigation depending on the final information architecture.

### Header behavior

- Initial state: transparent/neutral against page background.
- On scroll: slightly stronger background separation and thin bottom border.
- Avoid dramatic shrinking animations.
- Sticky navigation should never cover content.

---

## 08. Homepage Composition

The homepage should **not** look like a generic SaaS landing page.

### Recommended visual sequence

```text
01  Navigation
02  Editorial Hero
03  Curated / Featured Products
04  Category Discovery
05  Why Asterra / Trust Signals
06  Limited Deal or Seasonal Feature
07  Lightweight FAQ / Support
08  Footer
```

### Hero

Use an editorial composition instead of a centered SaaS hero.

Example:

```text
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé  DIGITAL TOOLS,                                             Γöé
Γöé  CURATED WELL.                    [Large product artwork]   Γöé
Γöé                                                              Γöé
Γöé  Premium apps for work, creativity, and everyday utility.  Γöé
Γöé  [Explore store]   [Browse categories]                       Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ
```

Rules:

- Headline should occupy a strong portion of the viewport.
- Supporting copy stays short.
- One primary CTA.
- Product artwork should feel like merchandise, not a random 3D illustration.
- The hero can use asymmetry and cropping to create tension.

---

## 09. Product Cards

Product cards are the most repeated component, so they must avoid visual monotony.

### Structure

```text
[ Product artwork / thumbnail ]

PRODUCT NAME
Short useful description

From RpXX.XXX             [Buy]
```

### Card rules

- Image area should carry visual weight.
- Product name: maximum 2 lines.
- Description: maximum 2ΓÇô3 lines.
- Price must be immediately scannable.
- Keep metadata secondary.
- Avoid five badges around the product title.
- The CTA can be integrated into the card footer rather than becoming a giant button.

### Card behavior

On hover:

- Image shifts 2ΓÇô4px or subtly zooms.
- Border contrast increases.
- CTA becomes slightly more visible.
- Duration: `180ΓÇô240ms`.

No dramatic card lift, glow, tilt, or 3D rotation.

---

## 10. Product Detail Page

The product detail page should behave like a **premium product listing**, not a SaaS feature page.

### Desktop layout

```text
ΓöîΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö¼ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÉ
Γöé                          Γöé  PRODUCT NAME                     Γöé
Γöé     Product artwork      Γöé  Short positioning statement     Γöé
Γöé                          Γöé                                  Γöé
Γöé                          Γöé  Price                            Γöé
Γöé                          Γöé  Purchase options                 Γöé
Γöé                          Γöé  [Buy now]                        Γöé
Γöé                          Γöé                                  Γöé
Γöé                          Γöé  Instant delivery ┬╖ Secure pay   Γöé
ΓööΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓö┤ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÿ

Overview / What's included / Requirements / FAQ
```

### Important information

Above the fold, users should understand:

1. What the product is.
2. Who it is for.
3. What they receive.
4. How much it costs.
5. How quickly they get it.
6. How to purchase.

Do not bury purchase-critical information under decorative sections.

---

## 11. Purchasing UX

The store exists to sell, so checkout must be extremely clear.

### CTA hierarchy

Primary:

- Buy now
- Continue to checkout
- Confirm purchase

Secondary:

- Add to cart
- View details
- Continue browsing

### Purchase flow

```text
Product
  Γåô
Purchase configuration
  Γåô
Order summary
  Γåô
Payment
  Γåô
Processing
  Γåô
Success / Delivery
```

### Rules

- Never hide the total price.
- Never make the primary CTA visually ambiguous.
- Keep the order summary visible during checkout.
- Avoid unnecessary form fields.
- Preserve user input when errors occur.
- Show processing feedback immediately after payment submission.

---

## 12. Buttons

### Primary

Dark or accent-filled button depending on context.

```text
[ Buy now ]
```

### Secondary

Outlined/neutral button.

```text
[ View details ]
```

### Tertiary

Text link.

```text
Explore all ΓåÆ
```

### Button behavior

```text
Rest      ΓåÆ stable
Hover     ΓåÆ subtle contrast shift
Press     ΓåÆ 1pxΓÇô2px visual compression
Focus     ΓåÆ visible focus ring
Loading   ΓåÆ preserve button width
Success   ΓåÆ concise confirmation
```

Do not make every action a high-contrast filled button.

---

## 13. Motion System

Motion should make the interface feel **smooth**, not theatrical.

### Timing

```css
--ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
--duration-fast: 140ms;
--duration-normal: 220ms;
--duration-slow: 420ms;
```

### Motion rules

Use animation for:

- Navigation state changes.
- Product image transitions.
- Drawer/modal entry and exit.
- Button feedback.
- Filter/sort changes.
- Cart updates.
- Route transitions where supported.

Avoid:

- Constant floating animations.
- Infinite decorative movement.
- Long entrance delays.
- Parallax everywhere.
- Bouncy spring animations on basic controls.

### Page entrance

Prefer subtle reveal:

```text
opacity: 0 ΓåÆ 1
translateY: 8px ΓåÆ 0
```

Keep the movement short and staggered only when it improves readability.

### Reduced motion

Respect:

```css
@media (prefers-reduced-motion: reduce) {
  /* minimize non-essential motion */
}
```

---

## 14. Responsive Behavior

Asterra must be designed mobile-first, then expanded.

### Breakpoints

```css
sm: 640px;
md: 768px;
lg: 1024px;
xl: 1280px;
2xl: 1536px;
```

### Desktop ΓåÆ mobile principles

Do not simply stack every desktop block.

Instead:

- Recompose the hierarchy.
- Reduce decorative content.
- Convert horizontal product rows into snap-scroll rails or 1ΓÇô2 column grids.
- Move filters into drawers/sheets.
- Simplify navigation.
- Keep product imagery large enough to remain compelling.
- Keep CTA controls thumb-friendly.

### Mobile targets

- Minimum touch target: `44px`.
- Horizontal padding: `16px`.
- Avoid dense two-column layouts when text becomes cramped.
- Avoid buttons narrower than their labels.
- Sticky purchase CTA is allowed on product detail pages when it improves conversion and does not obscure content.

### Small mobile

At widths around `320ΓÇô375px`:

- Never allow horizontal page overflow.
- Clamp headlines instead of shrinking them to unreadable sizes.
- Keep prices and CTA readable.
- Prefer content removal over excessive compression.

---

## 15. Responsive Product Grids

Recommended behavior:

```text
< 640px      ΓåÆ 1 column
640ΓÇô1023px   ΓåÆ 2 columns
1024ΓÇô1279px  ΓåÆ 3 columns
1280px+      ΓåÆ 4 columns when content density allows
```

A product grid should not become four tiny cards simply because the screen is wide. The card must retain enough visual presence to sell the product.

---

## 16. Search & Discovery

Search should feel like a store utility, not a dashboard filter panel.

### Search input

- Large enough to scan and type comfortably.
- Clear placeholder.
- Keyboard-friendly.
- Search results should update quickly.

### Filters

Use only filters that materially help discovery.

Potential filters:

- Category
- Price
- Platform / compatibility
- Availability

Avoid turning every product attribute into a filter.

### Empty search state

Do not show a giant illustration.

Use concise recovery guidance:

```text
No products found for ΓÇ£..."
Try a broader search or browse categories.
```

---

## 17. Images & Product Artwork

### Direction

Product visuals should feel like **merchandise photography or editorial product art**.

Use:

- Clean compositions.
- Strong crops.
- Consistent aspect ratios.
- Realistic screenshots when available.
- Brand-consistent artwork.

Avoid:

- Generic AI-generated futuristic scenes.
- Random floating laptops.
- Excessive neon glow.
- Unrelated abstract shapes.
- Stock-photo business teams.

### Image ratios

Recommended:

```text
Product card: 4:3 or 1:1
Hero artwork: 4:3 / 16:10
Product detail gallery: 4:3
```

Always provide a meaningful fallback background when imagery is unavailable.

---

## 18. Icons

Use **Lucide** or an equally consistent outline icon system.

### Rules

- Icons support text; they should rarely replace it.
- Keep icon stroke weight visually consistent.
- Do not put every icon inside a colored circle.
- Avoid mixing filled, outline, and emoji-style icons.

Examples:

```text
Search   ΓåÆ Search
Cart     ΓåÆ ShoppingBag / ShoppingCart
Account  ΓåÆ UserRound
Arrow    ΓåÆ ArrowUpRight
Filter   ΓåÆ SlidersHorizontal
Close    ΓåÆ X
```

---

## 19. Surfaces & Components

Asterra should not become a "card system" where everything is boxed.

### Use surfaces for

- Product items.
- Checkout summary.
- Dialogs.
- Important grouped controls.
- Feature comparisons where grouping genuinely helps.

### Do not use surfaces for

- Every paragraph.
- Every navigation item.
- Every feature.
- Every section title.
- Decorative grouping with no information benefit.

A section may simply be typography + content + whitespace.

---

## 20. Trust Signals

Trust should be communicated visually without looking like a banking website.

Examples:

```text
Instant delivery
Secure payment
Clear pricing
Human support
Verified products
```

Use short supporting labels, not giant trust banners.

Avoid fake review counts, fake scarcity, or unsupported guarantees.

---

## 21. States

Every important interactive component needs these states:

```text
Default
Hover
Focus
Active / Pressed
Disabled
Loading
Success
Error
Empty
```

### Loading

Prefer skeletons that resemble the final layout.

Avoid a full-screen spinner unless an entire application transition genuinely requires it.

### Error

Errors should explain:

- What happened.
- What the user can do next.

Never show raw API errors to users.

### Success

Keep confirmation calm and obvious.

Do not blast the screen with confetti.

---

## 22. Accessibility

### Requirements

- Text contrast should meet WCAG AA where applicable.
- Visible keyboard focus.
- Semantic HTML.
- Form labels should be explicit.
- Images require useful alt text unless decorative.
- Do not rely on color alone to communicate state.
- Touch targets should generally be at least `44px`.
- Support reduced motion.
- Dialogs must trap focus correctly.
- Checkout errors must be announced accessibly.

### Typography

Never sacrifice readability for aesthetic tightness.

Do not use very light font weights for body text.

---

## 23. Content Style

### Voice

Asterra copy should be:

- Clear.
- Concise.
- Confident.
- Human.
- Useful.

Avoid:

- "Revolutionize your workflow."
- "Unlock the future of productivity."
- "Supercharge your digital journey."
- Empty startup buzzwords.

Prefer specific language:

```text
Premium apps, ready when you are.

Buy once. Get access fast.

Tools worth paying for, without the clutter.
```

The exact final brand copy should be validated separately; the examples above define tone, not mandatory messaging.

---

## 24. Desktop / Tablet / Mobile Composition Rules

### Desktop

Goal: editorial, spacious, visually distinctive.

Use:

- Large type.
- Strong horizontal rhythm.
- Asymmetric sections.
- Large product imagery.
- More breathing room around key content.

### Tablet

Goal: preserve hierarchy while reducing complexity.

Use:

- Smaller display type.
- Fewer simultaneous columns.
- Simplified hero composition.
- More vertical stacking.

### Mobile

Goal: fast scanning and effortless purchase.

Use:

- Strong vertical rhythm.
- Large tappable controls.
- Minimal navigation chrome.
- Horizontal product rails when helpful.
- Sticky purchase CTA where justified.

---

## 25. Performance Rules

Asterra should feel fast, not merely look fast.

### Rules

- Lazy-load non-critical images.
- Use modern image formats when supported.
- Reserve image dimensions to prevent layout shift.
- Avoid shipping large animation libraries for simple transitions.
- Prefer CSS transitions for micro-interactions.
- Defer non-critical third-party scripts.
- Keep above-the-fold content lightweight.
- Prevent layout shifts during font/image loading.

### Perceived performance

The interface should provide immediate visual feedback for:

- Search.
- Add to cart.
- Purchase submission.
- Route changes.
- Filter changes.

---

## 26. Component Architecture

Recommended component groups:

```text
layout/
  Header
  Footer
  Container
  Section

navigation/
  MainNav
  MobileNav
  Breadcrumbs
  Search

commerce/
  ProductCard
  ProductGrid
  ProductGallery
  PriceBlock
  PurchaseOptions
  CartSummary
  OrderSummary
  CheckoutForm
  PurchaseStatus

content/
  Hero
  CategoryRail
  FeaturedProducts
  TrustStrip
  FAQ

feedback/
  Toast
  Modal
  Drawer
  Skeleton
  EmptyState
  ErrorState
```

Components should own behavior and states rather than duplicating interaction logic across pages.

---

## 27. Design Tokens

Centralize tokens so the visual language can evolve without rewriting components.

```css
:root {
  /* Colors */
  --color-bg: #F7F5F0;
  --color-surface: #FCFBF8;
  --color-surface-raised: #FFFFFF;
  --color-ink: #171A18;
  --color-ink-soft: #303633;
  --color-muted: #707874;
  --color-border: #D9DDD8;
  --color-border-strong: #B9BFBB;
  --color-accent: #C66543;
  --color-accent-dark: #A94F32;
  --color-accent-soft: #F1DFD7;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
  --space-30: 120px;

  /* Motion */
  --ease-standard: cubic-bezier(0.2, 0.7, 0.2, 1);
  --duration-fast: 140ms;
  --duration-normal: 220ms;
  --duration-slow: 420ms;
}
```

---

## 28. Implementation Rules

### Must

- Use responsive CSS intentionally.
- Use semantic HTML.
- Keep interactive feedback immediate.
- Preserve consistent spacing tokens.
- Reuse primitives instead of duplicating styles.
- Test on real narrow viewport widths.
- Validate loading, empty, and error states.

### Must not

- Hard-code dozens of slightly different neutral colors.
- Add a new radius for every component.
- Add shadows merely because a card looks empty.
- Add animation merely because a page feels static.
- Use decorative elements to compensate for weak content hierarchy.
- Create different button styles for every section.

---

## 29. Visual QA Checklist

Before shipping a page, verify:

### Hierarchy

- Can the user identify the page purpose in under 3 seconds?
- Is the primary action obvious?
- Does typography create hierarchy without excessive badges?

### Composition

- Does the page have a strong visual focal point?
- Are there sections that could be unboxed?
- Is the page visually interesting without gradients or glow effects?

### Responsive

- Works at `320px`.
- Works at `375px`.
- Works at `768px`.
- Works at `1024px`.
- Works at `1440px+`.
- No accidental horizontal overflow.

### Interaction

- Hover is subtle.
- Focus is visible.
- Press feedback exists.
- Loading states preserve layout.
- Error states are understandable.

### Commerce

- Product value is clear.
- Price is easy to find.
- Purchase CTA is obvious.
- Checkout total is visible.
- Delivery/access expectation is explicit.

### Anti-slop

- No unnecessary gradients.
- No excessive glassmorphism.
- No random decorative blobs.
- No repeated generic cards.
- No fake AI-looking visuals.
- No overuse of pills.

---

## 30. Final Design Principle

> **Asterra should look designed, not decorated.**

Distinctiveness must come from **composition, typography, product presentation, and interaction quality** ΓÇö not from stacking trendy visual effects.

Every visual decision should answer at least one of these questions:

1. Does it help users discover a product?
2. Does it improve trust or clarity?
3. Does it make purchasing easier?
4. Does it strengthen the Asterra brand?

If the answer is no, remove it.

