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

## Maskito and OTP inputs

`MaskitoInput` uses `@maskito/core`; number/date/time presets additionally use `@maskito/kit`. It supports native text/tel/search/url/password inputs, not `type="number"`; choose `inputmode` for the mobile keyboard. Keep only one masking engine on an input. AutoInit recognizes `input[data-maskito]:not([data-otp])`.

```ts
import { MaskitoInput, OtpInput } from 'kmaterialize';
const code = MaskitoInput.init(document.querySelector<HTMLInputElement>('#reference')!, {
  pattern: 'AA-####'
});
await code.ready;
await code.setValue('AB1234');

const otp = OtpInput.init(document.querySelector<HTMLInputElement>('#verification')!, {
  length: 6,
  groupSize: 3,
  onComplete: value => { /* submit only through the application's chosen flow */ }
});
await otp.ready;
```

Use `.no-autoinit` on explicitly initialized inputs when their opt-in data attributes are also present. Pattern tokens: `#` digit, `A` ASCII letter, `*` alphanumeric; backslash escapes a literal. `MaskitoInput` accepts `preset: 'pattern' | 'number' | 'date' | 'time'`, the corresponding kit options and `maskOptions`. `getValue()` returns the formatted native string; `setValue(value, emit?)` and `refresh()` are async. Use kit parsers for typed numeric/date values.

`OtpInput` enhances one accessible native input into visual slots; do not replace it with unrelated inputs per digit. AutoInit selector: `input[data-otp]`. It uses Maskito core, supports `length` 1–32 (default 6), `characters: 'digits' | 'alphanumeric'`, `pattern`, `groupSize`, `masked`, and `onComplete(value, instance)`. A supplied pattern owns the mask and infers its editable length; explicit length must agree. `groupSize` is only visual; literal pattern separators remain in the native value. Methods: `getValue()`, `getUnmaskedValue()` (editable characters only), `isComplete()`, async `setValue(value, emit?)` / `clear(emit?)`, and `destroy()`. Submission still uses the original input/name.

## Rich textarea

`RichTextarea` enhances `textarea[data-editor="quill"]`; install `quill` and load its CSS before Materialize. Initialize explicitly for readiness/error handling:

```ts
import { RichTextarea } from 'kmaterialize';
const notes = RichTextarea.init(document.querySelector<HTMLTextAreaElement>('#notes')!, {
  valueFormat: 'html',
  placeholder: 'Add review notes'
});
await notes.ready;
notes.setValue('<p>Ready for review.</p>');
const value = notes.getValue();
```

`valueFormat` is `html` by default or `text`; `toolbar`, `formats`, `label` and `placeholder` configure the wrapper. The hidden original textarea stays synchronized for form submission, reset and validation. `quill` is available after `ready`. Treat generated rich HTML according to the application's rendering/sanitization boundary. Destroy on unmount.

## Outlined fields and input actions

Current kmaterialize provides real outline notches over solid/gradient/image surfaces, native Materialize checkbox styling, and corrected select/dropdown ownership. Do not load the stock v2 workaround stylesheet automatically into the fork. For an input copy action, place a `button.suffix.input-copy-button[data-copy-target="#input-id"]` inside `.input-field`; use `type="button"`, an accessible label and a unique target ID. The framework handles dynamically inserted copy controls.

Sources for these additions: `components/{maskito-input,otp-input,rich-textarea,checkbox}/`, field styles and forms initialization. Verify option names in installed declarations before using later builds.
