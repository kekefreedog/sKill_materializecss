# v1 → v2 Migration

This reference describes stock Materialize v2. For the kmaterialize fork, apply [kmaterialize.md](kmaterialize.md) first; enhanced forms and reusable extensions have dedicated references linked there.

Most Materialize content in the wild — tutorials, Stack Overflow answers, admin templates — documents **v1.0.0** (Dogfalo, jQuery-era). This file exists so you can *recognize and convert* v1 code. **Never emit v1 markup or jQuery.**

Almost every difference below fails **silently**: no console error, the element simply renders unstyled or does nothing.

## 1. Remove jQuery entirely

v2 has no jQuery integration and does not bundle `cash-dom`. Every plugin-style call must become a static `init`.

| v1 (jQuery) | v2 |
|---|---|
| `$('.carousel').carousel()` | `M.Carousel.init(els)` |
| `$('.chips').chips()` | self-initializes |
| `$('.collapsible').collapsible()` | `M.Collapsible.init(els)` |
| `$('.datepicker').datepicker()` | `M.Datepicker.init(els)` |
| `$('.dropdown-trigger').dropdown()` | `M.Dropdown.init(els)` |
| `$('.fixed-action-btn').floatingActionButton()` | `M.FloatingActionButton.init(els)` |
| `$('.materialboxed').materialbox()` | `M.Materialbox.init(els)` |
| `$('.modal').modal()` | native `<dialog>` — see §3 |
| `$('.parallax').parallax()` | `M.Parallax.init(els)` |
| `$('.pushpin').pushpin()` | `M.Pushpin.init(els)` |
| `$('.scrollspy').scrollSpy()` | `M.ScrollSpy.init(els)` |
| `$('.sidenav').sidenav()` | `M.Sidenav.init(els)` |
| `$('.slider').slider()` | `M.Slider.init(els)` |
| `$('.tabs').tabs()` | `M.Tabs.init(els)` |
| `$('.tap-target').tapTarget()` | `M.TapTarget.init(els)` |
| `$('.timepicker').timepicker()` | `M.Timepicker.init(els)` |
| `$('.tooltipped').tooltip()` | `M.Tooltip.init(els)` |
| `$('select').formSelect()` | `M.FormSelect.init(els)` |
| `$('#x').characterCounter()` | automatic via `data-length` |

Method calls change shape too:

```js
// v1
$('.modal').modal('open');
$('.sidenav').sidenav('close');

// v2
M.Sidenav.getInstance(el).close();
```

Document-ready wrapper:

```js
// v1
$(document).ready(function () { $('.tabs').tabs(); });

// v2
document.addEventListener('DOMContentLoaded', () => { M.AutoInit(); });
```

## 2. The grid is CSS Grid — drop `.col`

v1 used floats and required `.col`. v2's `.row` is `display: grid`, and the span classes go directly on the child.

```html
<!-- v1 -->
<div class="row">
  <div class="col s12 m6 l4">…</div>
</div>

<!-- v2 -->
<div class="row">
  <div class="s12 m6 l4">…</div>
</div>
```

`push-*` and `pull-*` are **gone**. The Sass mixins that generated them are never invoked, so no classes are emitted. Reorder with `offset-*`, `grid-column-start`, or CSS `order`.

Breakpoint prefixes and pixel ranges are unchanged (`s` ≤600, `m` 601–992, `l` 993–1200, `xl` 1201+).

New in v2: gap utilities `g-0`–`g-5` and the `--gap-size` custom property.

> Watch out: `.offset-s1` and `.offset-s2` are swapped in v2 (an upstream bug). `offset-s3`+ and all `m`/`l`/`xl` offsets are correct.

## 3. Modals are native `<dialog>`

`M.Modal` still exists but is a **dead stub** — `components/dialog/modal.ts` is marked *"Obsolete for versions > 2.1.1"*, `open()`/`close()` return `this` without acting, and every handler is empty. `.modal-trigger` is not wired to anything.

```html
<!-- v1 -->
<a class="modal-trigger btn" href="#modal1">Open</a>
<div id="modal1" class="modal">
  <div class="modal-content"><h4>Title</h4></div>
  <div class="modal-footer">
    <a class="modal-close btn-flat">Close</a>
  </div>
</div>

<!-- v2 -->
<button class="btn filled" id="open-modal">Open</button>
<dialog id="modal1" class="modal">
  <div class="modal-header"><h5>Title</h5></div>
  <div class="modal-content"><p>Body</p></div>
  <div class="modal-footer">
    <button class="btn text modal-close">Close</button>
  </div>
</dialog>
```

```ts
const modal = document.querySelector<HTMLDialogElement>('#modal1')!;
document.querySelector('#open-modal')?.addEventListener('click', () => modal.showModal());
modal.querySelector('.modal-close')?.addEventListener('click', () => modal.close());
```

`.modal-header` is new; styling hooks are `.modal[open]` and `.modal::backdrop`. Escape-to-close and focus trapping are now browser-native. `.bottom-sheet` still works.

The v1 options (`opacity`, `dismissible`, `startingTop`, `endingTop`, `inDuration`, `outDuration`, the four callbacks) still appear in the type definitions but have **no effect**. Replace them:

| v1 option | v2 equivalent |
|---|---|
| `dismissible: true` | click-on-backdrop listener (see `components.md`) |
| `onOpenEnd` | `dialog.addEventListener('close' \| 'cancel', …)` |
| `opacity`, `startingTop`, `endingTop` | CSS on `.modal` / `.modal::backdrop` |
| `inDuration` / `outDuration` | CSS transitions |

## 4. Theming: Sass variables → MD3 tokens

v1 was themed by overriding Sass variables before importing. v2 is themed with CSS custom properties, so it can change at runtime.

```scss
// v1
$primary-color: color("blue", "lighten-2");
@import "materialize";
```

```css
/* v2 */
:root {
  --md-sys-color-primary-light: #6750a4;
  --md-sys-color-primary-dark: #d0bcff;
}
```

Dark mode is built in — it follows `prefers-color-scheme`, and `document.documentElement.setAttribute('theme','dark')` forces it. v1 had no dark mode.

### Colour classes moved

`.red`, `.blue.darken-2`, `.teal-text` compile to a **separate** stylesheet in v2, `dist/css/materialize.colors.min.css`. If you ported markup that uses them and everything is unstyled, that's why. Prefer the MD3 utilities (`.primary`, `.surface`, `.on-surface-text`), which adapt to the theme.

## 5. Class renames and removals

| v1 | v2 | Note |
|---|---|---|
| `col s12` | `s12` | `.col` removed |
| `push-s5` / `pull-s7` | `offset-s5` | never emitted in v2 |
| `nav` (with `navbar`) | `navbar` | `.nav` is not a class |
| `card-tabs` | `.tabs` inside `.card-content` | removed |
| `helper-text` | `supporting-text` | renamed |
| `data-success` | — | removed; only `data-error` remains |
| `waves-teal`, `waves-red`, `waves-block` | `waves-light` or nothing | only `waves-light`/`waves-circle` are read |
| `btn-flat` | `btn text` | `btn-flat` kept as an alias |

Carried over unchanged: `card`, `card-content`, `card-action`, `card-image`, `card-title`, `card-reveal`, `card-stacked`, `card-panel`, `activator`, `halfway-fab`, `collection`, `collection-item`, `secondary-content`, `sidenav`, `sidenav-fixed`, `sidenav-trigger`, `dropdown-trigger`, `dropdown-content`, `tabs`, `tab`, `collapsible`, `collapsible-header`, `collapsible-body`, `chip`, `chips`, `badge`, `new`, `breadcrumb`, `pagination`, `preloader-wrapper`, `spinner-layer`, `progress`, `determinate`, `indeterminate`, `divider`, `tap-target`, `parallax`, `materialboxed`, `toast`, `input-field`, `prefix`, `suffix`, `materialize-textarea`, `switch`, `lever`, `filled-in`, `with-gap`, `range-field`, `select-wrapper`, `browser-default`, `file-field`, `file-path`, `z-depth-*`, `hide-on-*`, `show-on-*`, `truncate`, `valign-wrapper`, `container`, `row`, `section`.

## 6. Ripples

v1 shipped `.waves-*` CSS. v2 renders the ripple in JavaScript with inline styles — **there is no `.waves-*` CSS at all**, which is expected, not a missing file.

`src/waves.js` delegates a click listener on `document.body`, matches `.waves-effect`, and reads only two modifiers:

- `waves-light` → white ripple
- `waves-circle` → circular

Every other v1 variant is ignored:

```html
<!-- v1 -->
<a class="waves-effect waves-teal btn-flat">Button</a>

<!-- v2 -->
<button class="btn text waves-effect">Button</button>
```

## 7. Buttons gained MD3 variants

v1 had `btn`, `btn-flat`, `btn-floating` and sizes. v2 adds a style axis:

```html
<button class="btn filled">Filled</button>
<button class="btn tonal">Tonal</button>
<button class="btn elevated">Elevated</button>
<button class="btn outlined">Outlined</button>
<button class="btn text">Text</button>
```

Plus `rounded` and `btn-block`. Icons use `icon-left` / `icon-right` on the button rather than `left` / `right` on the `<i>`. v1 examples use `<a class="btn">`; prefer `<button>`.

## 8. Toasts

```js
// v1 — function, `html` key
M.toast({ html: 'Saved', displayLength: 4000 });

// v2 — constructor, `text` key
new M.Toast({ text: 'Saved', displayLength: 4000 });
M.Toast.dismissAll();
```

Passing `html` in v2 produces an empty toast.

## 9. Data shapes changed

**Autocomplete** — object map becomes an array of records:

```js
// v1
{ data: { 'Apple': null, 'Google': 'https://…/img.png' } }

// v2
{ data: [
    { id: 1, text: 'Apple' },
    { id: 2, text: 'Google', image: 'https://…/img.png' }
] }
```

**Chips** — `tag` becomes `text`, and an `id` is required:

```js
// v1
{ data: [{ tag: 'Apple' }] }

// v2
{ data: [{ id: 1, text: 'Apple' }] }
```

Also note `allowUserInput` defaults to `false` in v2 — v1 chips accepted typing by default, so add it explicitly to preserve behaviour.

## 10. Text fields

The v1 `.input-field` pattern still works. v2 adds a CSS-only `fieldset.form-field` pattern that needs no JavaScript and supports a proper notched outline — prefer it for new work. See `forms.md`.

```html
<!-- v2, preferred -->
<fieldset class="form-field animated s12 m4">
  <legend>Given Name</legend>
  <input type="text" id="given-name" placeholder=" ">
  <label for="given-name">Given Name</label>
</fieldset>
```

The `placeholder=" "` is required — the float is driven by `:placeholder-shown`.

## 11. Components with no v2 equivalent

The v1 docs site itself defined several classes in its own stylesheet, not in the framework. These look like Materialize classes but never existed in either version:

`toc-wrapper`, `section table-of-contents`, `grid-example`, `browser-window`, `promo-caption`, `method-header`, `flat-text`

If you're porting from a Materialize docs page or an admin template, strip these.

## Conversion checklist

1. Delete every `$(...)`, jQuery `<script>` tag, and `cash-dom` reference.
2. Remove `col` from every grid child; replace `push-*`/`pull-*`.
3. Convert `.modal` divs to `<dialog>`; rewire triggers to `showModal()`.
4. Replace `M.toast({html})` with `new M.Toast({text})`.
5. Reshape autocomplete and chips data to `{ id, text, image }` arrays.
6. Swap Sass colour overrides for `--md-sys-color-*` overrides.
7. Add `materialize.colors.min.css` if legacy palette classes are still needed.
8. Strip `waves-*` colour variants down to `waves-light`.
9. Rename `helper-text` → `supporting-text`; drop `data-success`.
10. Run `scripts/verify-classes.mjs` to catch anything left over.
