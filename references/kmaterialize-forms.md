# kmaterialize enhanced inputs

Sources: `components/{password-input,number-input,color-input,air-datepicker,file-input,tom-select}/*.ts`, `src/peer-loader.ts`, checkout recorded in [kmaterialize.md](kmaterialize.md).

## Optional dependencies and lifecycle

| Wrapper | Install peer | Plain-script global | Instance API after `ready` |
|---|---|---|---|
| PasswordInput | None | — | Synchronous visibility toggle |
| NumberInput | `imask` | `IMask` | `.mask` |
| ColorInput | `@simonwep/pickr` | `Pickr` | `.pickr` |
| AirDatepickerField | `air-datepicker` | `AirDatepicker` | `.picker` |
| FileInput | `filepond` | `FilePond` | `.pond`, `.getFiles()` |
| TomSelectField | `tom-select` | `TomSelect` | `.tomSelect` |

Peers are dynamically imported on demand, with a global fallback for plain scripts. Missing peers reject initialization; they are not bundled. Install the peers used by the page and account for your bundler's resolution of literal dynamic imports. Load peer CSS (Pickr theme, Air Datepicker, FilePond and any image-preview plugin, Tom Select) before `kmaterialize/dist/css/materialize.css`, so the fork's overrides win. IMask needs no CSS.

Enhanced wrappers except PasswordInput expose `ready: Promise<void>`; initialize explicitly and handle its rejection when readiness/errors matter. Destroy instances when removing their UI.

```html
<div class="input-field outlined">
  <input id="amount" class="no-autoinit" type="text" data-type="number"
    data-number-controls data-number-large-step="10" step="0.5" min="0" max="100" placeholder=" ">
  <label for="amount">Amount</label>
</div>
```

```ts
import { NumberInput } from 'kmaterialize';
const amount = NumberInput.init(document.querySelector<HTMLInputElement>('#amount')!, {
  scale: 2, thousandsSeparator: ' ', radix: '.', mapToRadix: [',']
});
try {
  await amount.ready;
  amount.increment();       // fine step
  amount.decrement(true);   // coarse step
  const value = amount.mask!.typedValue;
} catch (error) {
  console.error('Amount input could not initialize', error);
}
```

Use `type="text" data-type="number"`, not native `type="number"`, because formatted values contain separators. `controls: true` or `data-number-controls` opts into the stepper. `step` / `largeStep` options override attributes; defaults are 1 and ten fine steps. Controls honor bounds, disabled/readonly and emit bubbling `input` and `change`. Read numeric values from the mask, not `Number(input.value)` when formatting adds separators.

## Other opt-in markup

```html
<div class="input-field outlined">
  <input id="password" type="password" data-password-toggle placeholder=" ">
  <label for="password">Password</label>
</div>
<div class="input-field outlined">
  <input id="color" type="color" data-color-picker="pickr" data-color-theme="classic" data-color-opacity="false" value="#336699">
  <label for="color">Color</label>
</div>
<div class="input-field outlined">
  <input id="date" type="text" data-date-picker="air-datepicker" data-date-format="yyyy-MM-dd" data-date-lang="fr-FR" placeholder=" ">
  <label for="date">Date</label>
</div>
<div class="file-field" data-file-picker="filepond" data-file-plugins="image-preview">
  <input type="file" name="files" multiple aria-label="Files">
</div>
<select class="tomselected" data-select-clear aria-label="Choice">
  <option value="">Choose</option><option value="one">One</option>
</select>
```

These selectors work through `AutoInit`; do not also manually initialize them unless marked `.no-autoinit`.

- **Password:** generated reveal/hide button; no peer needed.
- **Color:** `theme` supports `classic`, `monolith`, `nano`; options also include `opacity`, `swatches`, `locale`. Dataset theme/opacity override options. `data-color-locale="fr-fr"` supplies the built-in French locale. Change events synchronize the native input.
- **Air Datepicker:** don't add stock `.datepicker` to the same input. Supports `data-date-range="true"` (or `multiple`), `data-date-timepicker`, `data-date-time-format`, `data-date-auto-close`, `data-date-view`, `data-date-min-view`, `data-date-mobile`, `data-date-position`, `data-date-buttons`. Date language uses `fr-FR`, unlike Pickr's `fr-fr`; explicit `locale` is also accepted.
- **FilePond:** initialize the `.file-field` wrapper, not its input. Plugin names: `image-preview`, `file-validate-type`, `image-exif-orientation`; install the corresponding `filepond-plugin-*` packages and any required CSS. `accept` automatically requests the validate-type plugin. Input attributes/dataset configure `multiple`, default file, max files, labels, preview/layout and instant upload. The wrapper does not define your server upload endpoint; configure the underlying pond through its API as needed.
- **Tom Select:** `.tomselected` excludes the input from FormSelect. `data-select-tag` enables creation; `data-select-clear` enables clearing. Remote data uses `remote: { url, value, label, search?, dataKey? }` or JSON `data-select-remote`; `settings` accepts Tom Select settings. `data-depends` identifies another element with a CSS selector. Keep app-specific remote contracts explicit rather than inventing endpoint shapes.
