# kmaterialize reusable extensions

Sources: `components/extensions/*.ts`, sibling SCSS and `components/extensions/web/`, checkout recorded in [kmaterialize.md](kmaterialize.md). These extensions are exported from the main package unless indicated otherwise; styles are already included in its main CSS.

## Expressive buttons, lists and dividers

Expressive sizing uses `.btn.btn-expressive` with `.btn-xs`, `.btn-sm`, `.btn-md`, `.btn-lg`, `.btn-xl`. Additional hooks include `.btn-square`, `.btn-icon`, `.btn-icon-standard`, `.btn-icon-narrow`, `.btn-icon-wide`, `.btn-toggle`, `.btn-group-connected`, `.btn-split`, `.btn-menu-trigger`, `.btn-fab`, `.fab-secondary`, `.fab-tertiary`, `.fab-small`, `.fab-large`, `.btn-fab-extended` and `.btn-rail`. Keep the base `.btn` and appropriate variant (`filled`, `tonal`, `outlined`, `elevated`, `text`).

```html
<div id="view-buttons" class="btn-group btn-group-connected" data-selection="single">
  <button type="button" class="btn btn-expressive btn-sm tonal btn-toggle" aria-pressed="true">Board</button>
  <button type="button" class="btn btn-expressive btn-sm tonal btn-toggle" aria-pressed="false">List</button>
</div>
```

```ts
import { initMaterialButtons, initListChecklist } from 'kmaterialize';
const disposeButtons = initMaterialButtons(document.querySelector<HTMLElement>('#view-buttons')!);
// Call disposeButtons() when unmounting this UI.
```

`initMaterialButtons(root)` wires dropdowns, toggle selection and `buttonaction` events. It owns those dropdown instances: avoid also initializing them through AutoInit. Dropdown targets must exist. It returns a cleanup function, not a Component instance.

Ordinary `.list` / `.list-item` layouts need no initialization. `initListChecklist(root)` adds submission-style checklist behavior using `.list-control[type="checkbox"]`, `[data-list-stamp]` and progress hooks; emits bubbling `listchange` and returns cleanup. Inspect `components/extensions/list.ts` and `list.scss` for the exact progress/timestamp markup before adding it. Dividers have additional CSS in `components/extensions/divider.scss`; verify modifier names there rather than inferring them from stock docs.

## Organization charts

`OrgChart` is data-driven and requires explicit initialization; it is not part of AutoInit and its `init` accepts one element.

```ts
import { OrgChart } from 'kmaterialize';
const chart = OrgChart.init(document.querySelector<HTMLElement>('#org')!, {
  data: {
    teams: [{ id: 'design', name: 'Design', x: 40, y: 40 }],
    people: [
      { id: 'lead', teamId: 'design', name: 'Alex', role: 'Lead' },
      { id: 'artist', teamId: 'design', name: 'Sam', role: 'Artist' }
    ],
    links: [{ from: 'lead', to: 'artist', label: 'Reviews' }]
  },
  draggable: true, connectable: true, editable: true,
  orientation: 'horizontal', zoom: 1,
  onChange: data => { /* persist the updated data */ }
});
chart.setZoom(0.8);
const snapshot = chart.getData();
// chart.setData(nextData); chart.resetZoom(); chart.destroy();
```

Team IDs and person IDs identify endpoints; use valid `teamId` relationships. Links default to person endpoints, or set `fromType` / `toType` to `person` or `team`. Options include `minZoom`, `maxZoom`, `onZoomChange`, `draggableTeams`, and `draggablePeople`; the separate movement flags override `draggable`. `connectable` defaults to true independently of movement, while editable link labels are opt-in. Team positions may omit x/y and use framework defaults. Teams/people accept `color`, `textColor`, `borderColor`, `accent`, `accentPosition` (`top/right/bottom/left`).

`getData()` returns a copy; update through `setData()`. Interactive connections dispatch cancelable `orgconnect` before insertion. `exportPdf(title?, { theme: 'light' | 'dark' })` opens a browser print preview for saving as PDF, not a PDF byte stream. Invoke directly from a user click so the preview window can open; it preserves the live chart's theme and zoom.

Lower-level exports `enableCardHandles`, `enableChartConnections`, `enableChartGestures` and `printChart` support custom chart integrations. Read their signatures when needed; a normal OrgChart already wires the corresponding behavior, so do not attach it twice.

## Tippy tooltips

Install `tippy.js`. The synchronous helper uses the separate entry point:

```ts
import { createTooltip } from 'kmaterialize/tippy';
const tip = createTooltip(document.querySelector<HTMLElement>('#help')!, 'material', {
  content: 'More information'
});
// tip.destroy();
```

Overloads accept `(element, options?)` with default `classic` style, or `(element, 'classic' | 'material', options?)`. It is not a main-entry `M.createTooltip` API. Include Tippy's required base/plugin CSS before Materialize's tooltip theme overrides. Custom button tooltips load the same optional peer asynchronously; stock `M.Tooltip` remains a separate component.

## Registered web components

Importing the main browser module registers `crazy-button`, its `regular-btn` alias, `crazy-loading` and `loading-screen-btn` when `customElements` is available. They render in light DOM and reuse framework styles. They do not require AutoInit.

```html
<crazy-button type="extended" variant="filled" label="Save" icon-text="save" icon-position="left"></crazy-button>
<crazy-loading id="saving" active="false" label="Saving…" complete-label="Saved" icon-text="cloud_upload"></crazy-loading>
```

```ts
import { CrazyLoading } from 'kmaterialize';
const saving = document.querySelector<CrazyLoading>('#saving')!;
saving.start();
await saving.updateComplete;
saving.stop('Saved');
```

`CrazyButton` attributes cover:

- `type`: `floating`, `extended`, `icon`, `fab`, `extended-fab`, `rail`; `variant`: `filled`, `tonal`, `outlined`, `elevated`, `text`, `standard`.
- `size`: `small`, `normal`, `large`, `extra-large` or `xs`–`xl`; `shape`: `round`, `box`, `square`; `depth`: `flat`, `outlined`, `1`–`5`.
- `label`, `icon-text`, `icon-class`, `icon-image`, `icon-position`, `color-primary`, `color-secondary`, `aria-label`.
- `disabled`, `toggle`, `pressed`; `href`, `target`; `menu-target`, `split`, `menu-label`; `button-type`, `name`, `value`, `form`, `action`.
- Tooltip style `classic` / `material` and position `top/right/bottom/left`. Icon-only buttons with a label create a tooltip and therefore require Tippy. Await `updateComplete` before `tooltipReady` to wait for the current render's tooltip.

`CrazyLoading` supports `active`, `size` (`small/normal/large`), `label`, `complete-label`, `aria-label`, `image`, `icon-text`, `icon-class` and slotted content. `start(label?)`, `stop(label?)`, `isActive` wrap the core Loading behavior. `loading-screen-btn` defaults to a large indicator and `/asset/favicon/android-chrome-192x192.png`; override `image` outside an app that provides that path.

## Building a component with Kmcomponent

Extend `Kmcomponent`, define `static properties` **before registration**, and use its template/style hooks. It supports typed `string`, `number`, `boolean`, `array`, `object` properties, defaults, validation selections and optional attribute reflection. Template context exposes `attributes` and `name`.

```ts
import { Kmcomponent, type KmcomponentProperties } from 'kmaterialize';
class StatusLabel extends Kmcomponent {
  static properties: KmcomponentProperties = {
    label: { type: 'string', default: 'Ready', reflect: true }
  };
  static template = '<span part="label"></span>';
  postRender() {
    this.renderRoot.querySelector('[part="label"]')!.textContent = String(this.getProperty('label'));
  }
}
if (!customElements.get('status-label')) customElements.define('status-label', StatusLabel);
```

Use `setProperty`, `getProperty` and `updateComplete` for reactive changes. `onCleanup(fn)` releases listeners/instances before rerender or disconnect. Query `renderRoot` in subclasses: light DOM is default; `static options = { shadow: true }` chooses an open shadow root at construction. Global CSS does not cross a shadow boundary; supply needed styles there.

Templates accept literal HTML, compiled Handlebars-style functions or default module wrappers; styles accept compiled CSS/functions/loader output. The runtime does not compile raw Handlebars or SCSS. It supports light-DOM slot projection or native shadow slots. Use escaped template values or DOM `textContent` for untrusted text.
