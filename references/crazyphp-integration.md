# CrazyPHP integration

Applies when the project is a **CrazyPHP** app (`kzarshenas/crazyphp`). Reference implementation: `rodeo_toolkit_2`.

CrazyPHP apps pin `@materializecss/materialize` on the **v2 line** (`^2.3.2`, resolving to 2.3.3), so everything else in this skill applies unchanged — v2 grid, MD3 tokens, native `<dialog>`, no jQuery.

## Stylesheet architecture

Two levels, and the distinction matters:

| Scope | File | Loaded |
|---|---|---|
| Global | `app/Front/style/scss/index.scss` | every page |
| Per page | `app/Environment/Page/<PageName>/style.scss` | that page only |

`index.scss` imports Materialize itself, then the shared layers:

```scss
@import '/node_modules/@materializecss/materialize/dist/css/materialize.min.css';
@import '/node_modules/@material-design-icons/font/index.css';
@import './component_enhance.scss';
@import './color_collection.scss', './color_gradient_collection.scss', './color_class.scss';
@import './dimensions.scss';
@import './grid.scss';
@import './typography.scss';
@import './cursors.scss';
@import './partial/…';
@import './global.scss';
```

These files use legacy `@import`, not `@use`/`@forward`. Match that in existing files rather than mixing module systems.

## The `enhancement/` layer

`app/Front/style/scss/enhancement/` holds one file per third-party widget, named `<library>_materializecss.scss`. Each makes a non-Materialize component sit correctly inside a Materialize v2 page.

| File | Library | Purpose |
|---|---|---|
| `airdatepicker_materializecss.scss` | Air Datepicker | remaps `--adp-*` onto MD3 tokens |
| `easepick_materializecss.scss` | easepick | forces the floating label into its raised state; raises `z-index` |
| `filepond_materializecss.scss` | FilePond | label colour and position |
| `form_materializecss.scss` | — | fixes to Materialize's own form controls |
| `jspreadsheet_materializecss.scss` | jSpreadsheet / kSpreadsheet | cell-editor font reset, dropdown stacking, `.jtabs` as MD3 tabs |
| `jsuites_materializecss.scss` | jSuites | dropdown/calendar/context-menu/colour-picker surfaces |
| `n8n_materializecss.scss` | `@n8n/chat` | chat widget variables |
| `pickr_materializecss.scss` | `@simonwep/pickr` | swatch button spacing, panel surface |
| `sweetalert_materializecss.scss` | SweetAlert2 | input width |
| `tomselect_materializecss.scss` | Tom Select | makes it indistinguishable from a Materialize `select` |

**These are imported per page, never globally.** Only pull in what the page uses:

```scss
/* app/Environment/Page/ProjectDeliveryQuotas/style.scss */
@import './../../../Front/style/scss/enhancement/jspreadsheet_materializecss.scss';
@import './../../../Front/style/scss/enhancement/sweetalert_materializecss.scss';
@import './../../../Front/style/scss/enhancement/tomselect_materializecss.scss';
```

The form-related ones (`form`, `tomselect`, `pickr`, `filepond`, `easepick`, `airdatepicker`) are pulled in together by `app/Front/style/scss/partial/_form.scss`.

## Two theming strategies

**A — remap the vendor's own custom properties** (preferred when the library exposes them). Scope to the vendor's root selector:

```scss
.air-datepicker {
    --adp-background-color: var(--md-sys-color-surface);
    --adp-color: var(--md-sys-color-on-surface);
    --adp-border-color: var(--md-sys-color-outline-variant);
    --adp-cell-background-color-selected: var(--md-sys-color-primary);
    --adp-color-secondary: var(--md-sys-color-on-surface-variant);
}
```

This is the cleanest option — it keeps dark mode working for free, since the MD3 tokens re-resolve when `theme` flips.

**B — write declarations directly against tokens**, when the library has no variable API:

```scss
.ts-dropdown .option {
    color: var(--md-sys-color-on-background);
}
```

### State layers

The shared idiom for hover/selected tints is `color-mix`, not opacity:

```scss
background-color: color-mix(in srgb, transparent, var(--md-sys-color-primary) 8%);
```

Materialize's own button mixins use the same technique, so this matches the framework.

## Authoring conventions

Every enhancement file opens with the project docblock:

```scss
/// /// ///
/// Enhancement - Crazy Content
///
/// Tom Select ft. Materialize
///
/// @package    kzarshenas/crazyphp
/// @author     kekefreedog <kevin.zarshenas@gmail.com>
/// @copyright  2022-2024 Kévin Zarshenas
/// /// ///
```

Then:

- **4-space indent**, with a blank line after every `{` and before every `}` — including single-declaration blocks.
- **A `//` label above each declaration group**, from a fixed vocabulary: `// Color`, `// Dimension`, `// Position`, `// Font`, `// Border`, `// Surface`, `// Elevation`, `// Depth` (for `z-index`), `// Display`, `// Transition`, `// Pointer`.
- **`/** … */` above each top-level rule** stating what it fixes.
- **Nesting mirrors the DOM**, one level per selector, rather than being flattened.
- **`&` only for state and pseudo chaining** — `&.focus`, `&.disabled`, `&:hover`, `&::before`. Never BEM-style `&__` / `&--` concatenation.

The two newest files (`jsuites`, `jspreadsheet`) additionally split into `/// Parameters` and `/// Styles` sections separated by full-width `///////` rules, with SCSS `$variables` under Parameters.

```scss
/**
 * Fix supporting-text position
 */
.input-field .supporting-text {

    // Position
    margin-top: 0px;
    vertical-align: top;

}
```

## Materialize globals that break embedded widgets

Two stock Materialize rules cause most integration friction. Both are documented in `jsuites_materializecss.scss`:

1. **`select { width: 100%; height: 3rem; border: … }`** — Materialize styles bare `select` elements globally, which wrecks a vendor widget's internal `<select>`. Reset it inside the vendor's scope.
2. **The global `a` colour** — overrides link colours inside body-appended popups.
3. **`input { font-family: Roboto; font-size: 100% }`** — breaks inline cell editors (jSpreadsheet resets these to `inherit`).

Note that jSuites/jSpreadsheet dropdowns are appended to `<body>`, so they escape any page-level scoping — target them at the root.

## Stock v2 classes worth knowing here

These look project-specific but ship with Materialize v2:

- **`.input-field.outlined`** — MD3 notched outline. Used in `app/Environment/Page/Login/template.hbs`.
- **`.input-field.error`** — error border and label, coloured `--md-sys-color-error`.
- **`.supporting-text`** with `data-error`.

Genuinely project-specific (do **not** expect these in stock Materialize):

- **`.suffix-hidden`** — swapped in for `div.suffix` by the framework at runtime. `Form.ts` (in `vendor/kzarshenas/crazyphp/src/Front/Library/Utility/Form.ts`) listens for the native `invalid` event, adds `.error` to the closest `div.input-field`, and toggles the suffix.
- **`.container-grid`** — from the project's own `grid.scss`.

Since validation state is applied by the framework's `Form.ts`, don't hand-roll a competing mechanism — style `.input-field.error` and let it drive.

## Writing a new enhancement file

1. Name it `<library>_materializecss.scss` in `app/Front/style/scss/enhancement/`.
2. Copy the docblock header; update the library name and copyright year.
3. Check whether the library exposes CSS custom properties. If it does, use strategy A.
4. Use `--md-sys-color-*` tokens only — **never hardcoded hex.** Anything hardcoded breaks dark mode, since the page can flip via `<html theme="dark">` at runtime.
5. Import it from the page's `style.scss` that needs it, not from `index.scss`.
6. Reach for `!important` only against vendor stylesheets you can't outrank; keep it off layout you control.

### Pitfalls present in the existing files — don't copy them

- `n8n_materializecss.scss` hardcodes ~17 hex colours and uses no MD3 tokens at all, so it doesn't respond to theme changes. Treat it as a counter-example, not a template.
- `pickr` and `tomselect` use `var(--md-sys-color-on-tertiary)` as a *background*. That's a token-role inversion — `on-*` tokens are meant for foreground content on the matching container. Prefer `--md-sys-color-surface` or `surface-variant`.
- `form_materializecss.scss` has a duplicated selector: `.input-field:not(.outlined), .input-field:not(.outlined)` — the second half was presumably meant to be a different element.
- `airdatepicker_materializecss.scss` references `--adp-nav-color-secondary`, which it never defines.
- `jspreadsheet_materializecss.scss` carries a fully commented-out `--jss_*` token map plus unused `$font-color-default: #444` / `$shadow-default` variables.

## Verification

`scripts/verify-classes.mjs` checks Materialize classes only; it will flag vendor classes (`.ts-control`, `.jss_worksheet`, `.air-datepicker`) as unknown. Point it at Materialize markup — templates and `.hbs` files — rather than at enhancement SCSS.
