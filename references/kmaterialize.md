# kmaterialize fork

Verified against local `kmaterialize` commit `f517de18`, package version `2.3.3`, on 2026-09-11. Sources: `package.json`, `src/index.ts`, `components/` TypeScript and `sass/materialize.scss`. This documents that checkout, not a claim that every published 2.3.3 package has these additions.

## Setup and differences from stock

```ts
import { AutoInit, Kanban, Loading, Popup, toast } from 'kmaterialize';
import 'kmaterialize/dist/css/materialize.css';
// Run after the page markup exists.
AutoInit(document.body);
toast({ text: 'Saved' });
```

Use the project's installed package or local checkout. ESM, CJS and declarations are exported at `kmaterialize`; browser scripts expose `M`. Sass entry: `kmaterialize/sass/materialize.scss`. Do not mix stock CSS with fork JavaScript.

The fork's main CSS includes the legacy palette, enhanced input themes and reusable extension styles. An extra `materialize.colors.css` is unnecessary for this build. Stock warnings about invisible bare buttons, separate palettes and checkbox/chips shims must not be applied blindly; inspect the installed CSS and rendered controls. Native `<dialog>` remains necessary: `Modal.open()` is still a stub. Use `Popup` for the SweetAlert2 alternative.

## Initialization

The stock AutoInit registry is extended with the following selectors, each excluding `.no-autoinit`:

| Component | Selector |
|---|---|
| Loading | `.loading` |
| Alert | `.alert` |
| Kanban | `.kanban-board` |
| Toolbar | `.toolbar:not(.fixed-action-btn)` |
| PasswordInput | `input[data-password-toggle]` |
| NumberInput | `input[data-type="number"]` |
| ColorInput | `input[type="color"][data-color-picker="pickr"]` |
| AirDatepickerField | `input[data-date-picker="air-datepicker"]` |
| FileInput | `.file-field[data-file-picker="filepond"]` |
| TomSelectField | `select.tomselected` |

`FormSelect` excludes `.tomselected` so both select wrappers never own the same element. AutoInit queries descendants, not the context element itself. It returns no promise: await individual enhanced input instances' `ready` when their peer APIs are needed. See [kmaterialize-forms.md](kmaterialize-forms.md).

`Popup`, `OrgChart`, helper functions and custom element registration are outside AutoInit. Module-level `Chips.Init()` and `Cards.Init()` install shared behavior; this does not prohibit per-element `Chips.init()` / `Cards.init()` when needed.

## Alerts, loading and popups

```html
<div class="alert alert-info" role="status">
  <i class="material-icons alert-icon" aria-hidden="true">info</i>
  <div class="alert-content"><strong class="alert-title">Saved</strong>Your changes are ready.</div>
  <button type="button" class="alert-close" aria-label="Dismiss">×</button>
</div>
<div id="busy" class="loading no-autoinit"><span class="loading-content">K</span></div>
```

Alerts support `alert-info`, `alert-success`, `alert-warning`, `alert-error`, plus `alert-outlined`, `alert-filled`, `alert-compact`. Icons may be images. `Alert.init(el, { dismissible: true, onDismiss })`; `dismiss()` hides after the transition, `open()` shows again, `destroy()` removes bindings.

```ts
const busy = Loading.init(document.querySelector<HTMLElement>('#busy')!, {
  active: false, label: 'Loading…', completeLabel: 'Ready'
});
busy.start('Saving…');
busy.stop('Saved');
```

Loading supplies the spinner if absent and updates `aria-busy`/`aria-label`. `stop()` retains central content. `destroy()` restores the original markup state.

Popup needs optional peer `sweetalert2`; load `sweetalert2/dist/sweetalert2.min.css` **before** Materialize CSS. No element/init call is needed:

```ts
const result = await Popup.fire({
  title: 'Apply changes?', icon: 'question', showCancelButton: true
});
if (result.isConfirmed) { /* apply the requested changes */ }
```

`PopupOptions` / `PopupResult` use SweetAlert2 types; `Popup.close()` is async. Default Materialize button classes can be customized, while `popup-container` / `popup` theme hooks are retained.

## Toolbar

```html
<div class="toolbar">
  <div class="toolbar-track">
    <span class="toolbar-track-indicator" aria-hidden="true"></span>
    <button type="button" class="toolbar-track-item is-active">Board</button>
    <button type="button" class="toolbar-track-item">List</button>
  </div>
  <div class="toolbar-search">
    <input class="toolbar-search-input" aria-label="Search" placeholder="Search">
  </div>
</div>
```

`Toolbar.init(el)` handles sliding track indicators and expandable search. Call `updateIndicators()` after changing active items or revealing a hidden toolbar. Bind application filtering separately. `.fixed-action-btn.toolbar` is the existing FAB mode and is excluded.

## Kanban

```html
<div id="board" class="kanban-board no-autoinit" aria-label="Tasks">
  <section class="kanban-column">
    <header class="kanban-column-header">Todo <span class="kanban-column-count"></span></header>
    <div class="kanban-column-body">
      <article class="kanban-card" data-kanban-accent="var(--md-sys-color-primary)" data-kanban-accent-position="left">Review layout</article>
    </div>
  </section>
  <section class="kanban-column">
    <header class="kanban-column-header">Done <span class="kanban-column-count"></span></header>
    <div class="kanban-column-body"><p class="kanban-empty">No tasks</p></div>
  </section>
</div>
```

```ts
const board = Kanban.init(document.querySelector<HTMLElement>('#board')!, {
  draggable: true, zoom: 1, minZoom: 0.5, maxZoom: 2,
  onMove: ({ card, from, to }) => { /* persist application IDs/order */ }
});
board.setZoom(0.8);
```

Methods: `setZoom`, `getZoom`, `resetZoom`, `destroy`. The component handles drag preview, insertion/reordering, counts and empty states; persistence belongs to the app. `onMove` receives DOM elements, not a serialized board. Disable individual cards with `.is-disabled` or `aria-disabled="true"`.

Appearance attributes: `data-kanban-color`, `data-kanban-text-color`, `data-kanban-accent`, `data-kanban-accent-position` (`top`, `right`, `bottom`, `left`). Colors must be valid CSS colors, including token variables. No public `setData()`/`addCard()` API exists; do not infer OrgChart methods apply to Kanban.

## Layout and style additions

Use `scripts/verify-classes.mjs --css <fork>/dist/css/materialize.css` for exact names.

- `.cursor-pointer`, `.cursor-grab`, other CSS cursor keywords and `-important` variants.
- `.screen-flex` with modifiers on the same element: `.screen-center`, `.screen-wrap`, `.screen-no-wrap`, `.screen-center-x`, `.screen-center-y`, `.screen-distributed-x`, `.screen-direction-y-asc` and related direction helpers. `.element-flex-grow-1` applies to descendants.
- `.screen-fit` is `width:100%; height:100vh`; `.screen-fit-x` sets width, but `.screen-fit-y` sets `align-items:stretch`, **not height**. Inspect `_global.scss` for the precise `screen-fit-min*` combinations.
- `.object-fit-cover`, `.object-fit-fill`; palette border classes such as `.red-border.border-darken-2` change border color only.
- Palette utilities such as `.light-mode-red` / `.dark-mode-red` follow `prefers-color-scheme` media queries, not the HTML `theme` override; existing gradient names such as `.gradient-45deg-purple-deep-purple` must be checked in `_colors.scss` rather than inferred from arbitrary color pairs.

For expressive buttons, lists, dividers, charts, Tippy and custom elements, read [kmaterialize-extensions.md](kmaterialize-extensions.md).
