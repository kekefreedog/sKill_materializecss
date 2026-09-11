---
name: materializecss
description: Build MaterializeCSS v2 and kmaterialize interfaces using TypeScript or vanilla JavaScript. Use for Materialize grid, MD3 theming, components and forms, including kmaterialize Kanban, organization charts, enhanced inputs, toolbars and reactive web components.
---

# MaterializeCSS v2 and kmaterialize

UI toolkit for Material Design 3. Covers stock **v2.3.3** (`@materializecss/materialize`) and the **kmaterialize** fork (MIT).

## Select the package first

Check the project's package manifest, lockfile and stylesheet imports. Both packages report `2.3.3`; the version alone does not identify the feature set. Preserve the project's chosen package.

For `kmaterialize`, read [references/kmaterialize.md](references/kmaterialize.md) first: it overrides the stock setup, palette and initialization guidance below. Read [references/kmaterialize-forms.md](references/kmaterialize-forms.md) for enhanced inputs and [references/kmaterialize-extensions.md](references/kmaterialize-extensions.md) for organization charts, expressive buttons, lists and web components. These additions were verified against local kmaterialize commit `f517de18` (2026-09-11); check the installed build before using them in an older release.

The remaining sections document the shared v2 foundation and **stock-package** behavior unless explicitly qualified.

> **v2 is not v1.** Most Materialize content online documents v1.0.0 (Dogfalo, jQuery-era) and its markup **fails silently** in v2 — no error, the element just doesn't work. If you are reading or porting v1 code, see `references/v1-migration.md`.

## Hard rules

1. **Never use jQuery.** No `$(...)`, no `jQuery`, no `cash-dom`, no plugin-style calls like `$('.modal').modal()`. v2 has no jQuery integration whatsoever. Use `M.Component.init()` or the ESM imports.
2. **TypeScript or vanilla JavaScript only.**
3. **Scope is UI.** Markup, styling, layout, theming, component behaviour.
4. **Verify framework class names** against the chosen package’s `dist/css/materialize.css` and JavaScript selectors. Application-defined classes are allowed when their styles or behavior are supplied. Use `scripts/verify-classes.mjs --css <installed-materialize.css>`; it checks framework markup, not arbitrary application classes.

## Stock package setup

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.3.3/dist/css/materialize.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">

<script src="https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.3.3/dist/js/materialize.min.js"></script>
<script>M.AutoInit();</script>
```

The browser build is an IIFE exposing the global **`M`**.

In stock Materialize, legacy colour classes (`.red`, `.blue.darken-2`, `.teal-text`) live in a **separate** stylesheet and are absent unless you add it:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.3.3/dist/css/materialize.colors.min.css">
```

Prefer MD3 token classes (`.primary`, `.surface`, `.on-surface-text`) over that legacy palette.

**npm / bundler:**

```bash
npm install @materializecss/materialize
```

```ts
import { AutoInit, Dropdown, Sidenav } from '@materializecss/materialize';
import '@materializecss/materialize/dist/css/materialize.min.css';
```

Sass consumers: `@use '@materializecss/materialize/sass/materialize';`

## Grid — CSS Grid, and there is no `.col`

`.row` is `display: grid` with 12 equal columns. Span classes go **directly on the child**.

```html
<div class="container">
  <div class="row">
    <div class="s12 m6 l4">Full on mobile, half on tablet, third on desktop</div>
    <div class="s12 m6 l8">Second column</div>
  </div>
</div>
```

- Spans: `s1`–`s12`, `m1`–`m12`, `l1`–`l12`, `xl1`–`xl12`
- Offsets: `offset-s1`…`offset-xl11` (set `grid-column-start`)
- Gap: `g-0` (0), `g-1` (.25×), `g-2` (.5×), `g-3` (1×), `g-4` (1.5×), `g-5` (3×) of `--gap-size` (default `1.5rem`, set on `body`)

| Prefix | Range | Container width |
|---|---|---|
| `s` | 0–600px | 90% |
| `m` | 601–992px | 85% |
| `l` | 993–1200px | 70% |
| `xl` | 1201px+ | 70% |

Smaller-breakpoint classes cascade upward: `s12` alone means 12 columns at every size. `.container` is `max-width: 1280px`.

**Never use `.col`, `push-*` or `pull-*`** — they do not exist in v2. `push`/`pull` mixins are defined in the Sass but never invoked, so no classes are emitted.

## Theming — MD3 tokens

Colour comes from ~30 CSS custom properties, not Sass variables:

```
--md-sys-color-primary          --md-sys-color-on-primary
--md-sys-color-primary-container --md-sys-color-on-primary-container
--md-sys-color-secondary / tertiary / error   (+ on-*, *-container, on-*-container)
--md-sys-color-background       --md-sys-color-on-background
--md-sys-color-surface          --md-sys-color-on-surface
--md-sys-color-surface-variant  --md-sys-color-on-surface-variant
--md-sys-color-outline          --md-sys-color-outline-variant
--md-sys-color-inverse-surface  --md-sys-color-inverse-on-surface
--md-sys-color-inverse-primary  --md-sys-color-shadow
--md-sys-color-surface-tint     --md-sys-color-scrim
```

Each has a utility class pair — `.primary` (background) and `.primary-text` (foreground):

```html
<div class="primary-container on-primary-container-text p-4">Tinted panel</div>
```

Custom CSS should reference tokens, never hex:

```css
.my-panel { background: var(--md-sys-color-surface-variant); color: var(--md-sys-color-on-surface-variant); }
```

**Dark mode** follows `prefers-color-scheme` automatically. To force it, set the `theme` attribute on `<html>`:

```ts
document.documentElement.setAttribute('theme', 'dark'); // or 'light'
```

## Initialization

Three paths — know which applies before writing init code.

**1. Self-initializing.** `Forms`, `Chips`, `Waves`, `Range` and `Cards` run at import time. Text fields, ripples and range sliders need **no** init. Do not call these yourself.

**2. `M.AutoInit()`** scans for these selectors (each also requires `:not(.no-autoinit)`):

| Component | Selector | Component | Selector |
|---|---|---|---|
| `Autocomplete` | `.autocomplete` | `Parallax` | `.parallax` |
| `Cards` | `.cards` | `Pushpin` | `.pushpin` |
| `Carousel` | `.carousel` | `ScrollSpy` | `.scrollspy` |
| `Chips` | `.chips` | `FormSelect` | `select` |
| `Collapsible` | `.collapsible` | `Sidenav` | `.sidenav` |
| `Datepicker` | `.datepicker` | `Tabs` | `.tabs` |
| `Dropdown` | `.dropdown-trigger` | `TapTarget` | `.tap-target` |
| `Materialbox` | `.materialboxed` | `Timepicker` | `.timepicker` |
| `Modal` | `.modal` | `Tooltip` | `.tooltipped` |
| `FloatingActionButton` | `.fixed-action-btn` | | |

Pass per-component options, and opt an element out with `class="no-autoinit"`:

```ts
M.AutoInit(document.body, { Dropdown: { hover: true }, Sidenav: { edge: 'right' } });
```

**3. Explicit init** — a single element returns one instance, a NodeList returns an array:

```ts
const instances = M.Collapsible.init(
  document.querySelectorAll('.collapsible'),
  { accordion: false }
);

const instance = M.Sidenav.getInstance(document.querySelector('.sidenav')!);
instance.open();
instance.destroy();
```

Most element components extend a common base (the fork’s `Popup`, `OrgChart`, helpers and web components have separate APIs): `static init(els, options)`, `static getInstance(el)`, `static get defaults`, and `destroy()`. Re-initializing an element automatically destroys the previous instance first.

## Components

Full markup, options and methods: `references/components.md`. Forms: `references/forms.md`.

Buttons · FAB · cards · collections/lists · navbar · sidenav · dropdown · tabs · collapsible · modal · materialbox · carousel · slider · chips · toasts · tooltip · badges · breadcrumbs · pagination · preloader/progress · divider · tap-target · parallax · pushpin · scrollspy · tables · footer

Buttons are MD3-styled in v2 and this is new — `.btn` plus one of `filled`, `tonal`, `elevated`, `outlined`, `text`:

```html
<button class="btn filled">Filled</button>
<button class="btn tonal">Tonal</button>
<button class="btn outlined">Outlined</button>
<button class="btn text">Text</button>
<button class="btn filled rounded">Rounded</button>
```

## Gotchas

Each of these fails **silently** — the markup looks correct and simply does nothing.

| Don't | Do | Why |
|---|---|---|
| `<div class="col s12">` | `<div class="s12">` | `.col` doesn't exist; `.row` is CSS Grid |
| `M.Modal.init(el)` then `.open()` | `<dialog class="modal">` + `.showModal()` | Modal JS is an empty stub in v2 |
| `class="waves-effect waves-teal"` | `class="waves-effect waves-light"` | Only `waves-light` and `waves-circle` are honoured |
| `<nav class="nav navbar">` | `<nav class="navbar">` | `.nav` isn't a class |
| `<div class="card-tabs">` | Put `.tabs` in `.card-content` | `.card-tabs` doesn't exist in v2 |
| `class="red darken-2"` | `class="primary"` | Legacy palette needs the extra stylesheet |
| `push-s5` / `pull-s7` | `offset-s5` | Push/pull classes are never emitted |
| Re-init `Forms`/`Chips`/`Waves`/`Range`/`Cards` | Leave them alone | They self-initialize on load |
| `<div class="input-field"><select>` | `<fieldset class="form-field">` | `FormSelect` generates its own `select-wrapper input-field` — wrapping double-nests it |
| `<input id="x">` in a field wrapper | `<input id="x" placeholder=" ">` | Without it the label is stuck floated over an empty field |
| `<ul class="right">` in a navbar | `<ul class="ml-auto">` | `.nav-wrapper` is flex; `float` is inert on flex items |
| Bare `<a>` in `.nav-wrapper` | `<ul><li><a>…</a></li></ul>` | Only `ul > li > a` gets colour and spacing |
| `M.Datepicker.init(el)` | `…init(el, { displayPlugin: 'docked' })` | Without it the calendar renders inline and never pops up |

**Stock-package shim only:** do not automatically load this asset for kmaterialize; check the fork’s rendered controls first. **Two form controls are broken in stock 2.3.3** by upstream CSS defects that markup cannot work around: checkbox/radio label text sits flush against the box, and the chips input renders as a full-width bordered field (the stylesheet misspells `.chips` as `.chis`). Load the shim after `materialize.css`:

```html
<link rel="stylesheet" href="assets/materialize-v2-fixes.css">
```

Details and the exact source lines are in `references/forms.md` under *Known upstream bugs*.

**Modals use the native `<dialog>` element:**

```html
<dialog id="confirm" class="modal">
  <div class="modal-header"><h5>Confirm</h5></div>
  <div class="modal-content"><p>Are you sure?</p></div>
  <div class="modal-footer">
    <button class="btn text modal-close">Cancel</button>
    <button class="btn filled">Agree</button>
  </div>
</dialog>
```

```ts
const dialog = document.querySelector<HTMLDialogElement>('#confirm')!;
document.querySelector('#open')?.addEventListener('click', () => dialog.showModal());
dialog.querySelector('.modal-close')?.addEventListener('click', () => dialog.close());
```

Styling hooks are `.modal[open]` and `.modal::backdrop`.

## Reference files

| File | Contents |
|---|---|
| `references/kmaterialize.md` | Fork setup, AutoInit additions, alerts, loading, popup, toolbar, Kanban and utilities |
| `references/kmaterialize-forms.md` | Optional peers, async enhanced inputs and numeric controls |
| `references/kmaterialize-extensions.md` | OrgChart, reusable helpers, Tippy and reactive web components |
| `references/layout-theming.md` | Grid, breakpoints, colour tokens, dark mode, typography, spacing, elevation, helpers |
| `references/components.md` | Per-component markup, init, options and methods |
| `references/forms.md` | Form fields, inputs, select, checkbox/radio/switch, range, autocomplete, chips, pickers |
| `references/typescript.md` | Imports, types, instance handling, framework integration |
| `references/v1-migration.md` | v1 → v2 conversion tables and jQuery removal |
| `references/crazyphp-integration.md` | CrazyPHP SCSS layout and the `enhancement/` convention |
| `assets/materialize-v2-fixes.css` | Shim for confirmed upstream bugs in 2.3.3 |
| `scripts/verify-classes.mjs` | Checks markup for classes that don't exist in v2 |

## CrazyPHP projects

If the project is a **CrazyPHP** app (`kzarshenas/crazyphp`), read `references/crazyphp-integration.md` before touching styles. Check whether the app uses stock Materialize or kmaterialize; third-party widgets are restyled through per-page `enhancement/<library>_materializecss.scss` files with their own conventions. Add to that layer rather than patching global CSS.
