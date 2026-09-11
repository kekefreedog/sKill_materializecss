# Layout & Theming — Materialize v2.3.3

This reference describes stock Materialize v2. For the kmaterialize fork, apply [kmaterialize.md](kmaterialize.md) first; enhanced forms and reusable extensions have dedicated references linked there.

All classes here are verified present in `dist/css/materialize.css`.

## Grid

`.row` is **CSS Grid**: `display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--gap-size);`

There is **no `.col` class in v2.** Span classes go directly on the row's children.

```html
<div class="container">
  <div class="row">
    <div class="s12 m8 l9">Main</div>
    <div class="s12 m4 l3">Sidebar</div>
  </div>
</div>
```

### Breakpoints

| Prefix | Range | `.container` width |
|---|---|---|
| `s` | 0 – 600px | 90% |
| `m` | 601 – 992px | 85% |
| `l` | 993 – 1200px | 70% |
| `xl` | 1201px + | 70% |

Sass media queries: `$medium-and-up` (≥601px), `$large-and-up` (≥993px), `$extra-large-and-up` (≥1201px), `$small-and-down` (≤600.99px), `$medium-and-down` (≤992.99px), `$medium-only` (601–992.99px).

Rules cascade upward — `s12` alone means 12 columns at every breakpoint, so you only declare the breakpoints that differ.

### Columns and offsets

- Spans: `s1`–`s12`, `m1`–`m12`, `l1`–`l12`, `xl1`–`xl12` → `grid-column: auto / span N`
- Offsets: `offset-s1`–`offset-s11`, and the same for `m`, `l`, `xl` → `grid-column-start`

> **Upstream bug:** `.offset-s1` and `.offset-s2` are swapped — `.offset-s1` sets `grid-column-start: 3` and `.offset-s2` sets `2`, the reverse of what they should be. `.offset-s3` through `.offset-s11` are correct, as are all `m`/`l`/`xl` offsets. Avoid `offset-s1`/`offset-s2`; use an empty spacer `<div class="s1">` instead.

**`push-*` and `pull-*` do not exist.** The Sass mixins that would generate them are defined but never invoked.

### Gap

`--gap-size` defaults to `1.5rem` on `body`. Override per row:

| Class | Gap |
|---|---|
| `g-0` | 0 |
| `g-1` | 0.25 × |
| `g-2` | 0.5 × |
| `g-3` | 1 × |
| `g-4` | 1.5 × |
| `g-5` | 3 × |

```html
<div class="row g-2">…</div>
<style>body { --gap-size: 1rem; }</style>
```

### Containers and sections

- `.container` — centred, `max-width: 1280px`
- `.section` — `padding: 1rem 0`

## Colour tokens

v2 is Material Design 3. Colour is CSS custom properties; Sass colour variables mostly just point at them.

### The 30 semantic tokens

Six families — `primary`, `secondary`, `tertiary`, `error` each provide four tokens:

```
--md-sys-color-primary              --md-sys-color-on-primary
--md-sys-color-primary-container    --md-sys-color-on-primary-container
```

Plus surface and utility tokens:

```
--md-sys-color-background        --md-sys-color-on-background
--md-sys-color-surface           --md-sys-color-on-surface
--md-sys-color-surface-variant   --md-sys-color-on-surface-variant
--md-sys-color-outline           --md-sys-color-outline-variant
--md-sys-color-inverse-surface   --md-sys-color-inverse-on-surface
--md-sys-color-inverse-primary   --md-sys-color-surface-tint
--md-sys-color-shadow            --md-sys-color-scrim
```

Underneath sit reference palettes — `--md-ref-palette-primary0` … `primary100` (tonal stops 0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100) for `primary`, `secondary`, `tertiary`, `neutral`, `neutral-variant`, `error`. Source colour is `--md-source: #006495`.

### Utility classes

Every token has a background class and a `-text` foreground class:

```html
<div class="primary on-primary-text p-4">Primary block</div>
<div class="surface-variant on-surface-variant-text p-4">Muted block</div>
<span class="error-text">Something went wrong</span>
```

Available: `primary`, `on-primary`, `primary-container`, `on-primary-container`, and the same for `secondary`, `tertiary`, `error`; plus `background`, `on-background`, `surface`, `on-surface`, `surface-variant`, `on-surface-variant`, `outline`, `outline-variant`, `inverse-surface`, `inverse-on-surface`, `inverse-primary`, `surface-tint`, `shadow`, `scrim`. Append `-text` for the colour variant.

Pair a container with its `on-` colour to stay accessible.

### Custom CSS

```css
.stat-card {
  background: var(--md-sys-color-surface-variant);
  color: var(--md-sys-color-on-surface-variant);
  border: 1px solid var(--md-sys-color-outline-variant);
}
```

### Retheming

Override the source tokens after the stylesheet loads:

```css
:root {
  --md-sys-color-primary-light: #6750a4;
  --md-sys-color-primary-dark: #d0bcff;
}
```

Set the `-light`/`-dark` pair rather than `--md-sys-color-primary` directly — `theme.module.css` resolves the unsuffixed name from those, so overriding only the unsuffixed one breaks when the theme flips.

## Dark mode

Three layers, in cascade order:

1. `:root, :host` → light defaults
2. `@media (prefers-color-scheme: dark)` → follows the OS
3. `:root[theme='light']` / `:root[theme='dark']` → explicit override, wins

```ts
type Theme = 'light' | 'dark';

function setTheme(theme: Theme): void {
  document.documentElement.setAttribute('theme', theme);
  localStorage.setItem('theme', theme);
}

const saved = localStorage.getItem('theme') as Theme | null;
if (saved) setTheme(saved);
```

To go back to following the OS, remove the attribute: `document.documentElement.removeAttribute('theme')`.

`color-scheme` is set alongside, so native form controls and scrollbars follow too.

## Legacy colour palette

The classic Material palette compiles to a **separate stylesheet**, `dist/css/materialize.colors.min.css`. Without it, `.red`, `.blue.darken-2` and `.teal-text` do nothing.

```html
<link rel="stylesheet" href="…/dist/css/materialize.colors.min.css">
```

Pattern: `.{colour}`, `.{colour}.lighten-1`…`lighten-5`, `.darken-1`…`darken-4`, `.accent-1`…`accent-4`, and text equivalents `.{colour}-text`, `.{colour}-text.text-darken-2`.

Prefer MD3 token classes. Reach for the legacy palette only for decorative accents that shouldn't shift with the theme — it's fixed hex and won't adapt to dark mode.

## Typography

### MD3 type scale

| Class | Size | | Class | Size |
|---|---|---|---|---|
| `display-large` | 57px | | `title-large` | 22px |
| `display-medium` | 45px | | `title-medium` | 16px |
| `display-small` | 36px | | `title-small` | 14px |
| `headline-large` | 32px | | `label-large` | 14px |
| `headline-medium` | 28px | | `label-medium` | 12px |
| `headline-small` | 24px | | `label-small` | 11px |
| `body-large` | 16px | | `body-medium` | 14px |
| `body-small` | 12px | | | |

```html
<h1 class="display-small">Page title</h1>
<p class="body-medium">Body copy</p>
```

Each role is backed by tokens: `--md-sys-typescale-{role}-font-size`, `-height`, `-font-weight`, `-tracking`, `-font-family-name`, `-font-style`, `-text-decoration`, `-text-transform`.

> **Upstream bug:** the generated `font-weight` tokens carry a `px` unit (`--md-sys-typescale-body-large-font-weight: 400px`). `font-weight` rejects lengths, so the declaration is dropped and weight inherits. Set `font-weight` explicitly if a specific weight matters.

### Headings and `flow-text`

Plain `h1`–`h6` are styled: 4.2rem, 3.56rem, 2.92rem, 2.28rem, 1.64rem, 1.15rem.

`.flow-text` scales paragraph text responsively across the breakpoint range.

Default font stack is system-native: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif`. Roboto is **not** bundled.

## Spacing utilities

Generated as `{property}{direction}-{step}`, all `!important`.

- Property: `m` (margin), `p` (padding)
- Direction: none (all), `t`, `r`, `b`, `l`, `x`, `y`
- Step: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `auto`

| Step | Value |
|---|---|
| 0 | 0 |
| 1 | 0.25rem |
| 2 | 0.5rem |
| 3 | 0.75rem |
| 4 | 1rem |
| 5 | 1.5rem |
| 6 | 3rem |

```html
<div class="p-4 mb-5 mx-auto">…</div>
```

## Elevation

`z-depth-0` through `z-depth-5`, plus `z-depth-1-half`. `.hoverable` raises an element on hover.

```html
<div class="card z-depth-3 hoverable">…</div>
```

## Helper classes

**Visibility** — `hide`, `hide-on-small-only`, `hide-on-small-and-down`, `hide-on-med-and-down`, `hide-on-med-and-up`, `hide-on-med-only`, `hide-on-large-only`, `hide-on-extra-large-only`, `show-on-small`, `show-on-medium`, `show-on-large`, `show-on-extra-large`, `show-on-medium-and-up`, `show-on-medium-and-down`

**Alignment** — `left-align`, `right-align`, `center-align`, `center`, `left`, `right`, `center-block`, `center-on-small-only`, `valign-wrapper`

**Other** — `truncate` (single-line ellipsis), `circle`, `no-padding`, `no-select`, `clearfix`, `divider`, `hoverable`, `fade-in`, `responsive-img`, `responsive-video`, `responsive-table`, `video-container`, `page-footer`, `footer-copyright`, `pinned`, `pin-top`, `pin-bottom`, `parallax`, `parallax-container`

## Tables

```html
<table class="striped highlight responsive-table">
  <thead><tr><th>Name</th><th>Qty</th></tr></thead>
  <tbody><tr><td>Widget</td><td>3</td></tr></tbody>
</table>
```

`striped` (alternating rows), `highlight` (hover), `centered`, `responsive-table` (scrolls horizontally on small screens).

## Footer

```html
<footer class="page-footer primary">
  <div class="container">
    <div class="row">
      <div class="s12 l6"><h5 class="on-primary-text">Company</h5></div>
      <div class="s12 l4 offset-l2"><h5 class="on-primary-text">Links</h5></div>
    </div>
  </div>
  <div class="footer-copyright"><div class="container">© 2026</div></div>
</footer>
```
