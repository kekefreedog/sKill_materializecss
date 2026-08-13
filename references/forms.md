# Forms — Materialize v2.3.3

> **Load `assets/materialize-v2-fixes.css` after `materialize.css`.** Two form controls are visibly broken in stock 2.3.3 by upstream defects that markup cannot work around — see [Known upstream bugs](#known-upstream-bugs) at the end of this file.

`Forms`, `Chips` and `Range` **self-initialize** when the script loads. Text fields, textareas and range sliders need no init call. Only `FormSelect`, `Autocomplete`, `Datepicker` and `Timepicker` need initializing (and `M.AutoInit()` covers all four).

## Text fields — the `form-field` pattern

v2's preferred input is CSS-only, built on `<fieldset>`. The float is driven by `placeholder=" "` (a single space) plus `:placeholder-shown`, so **the placeholder attribute is required** — omit it and the label won't float.

```html
<div class="row">
  <fieldset class="form-field animated s12 m4">
    <legend>Given Name</legend>
    <input type="text" id="given-name" placeholder=" ">
    <label for="given-name">Given Name</label>
  </fieldset>

  <fieldset class="form-field s12 m4" disabled>
    <legend>Family Name</legend>
    <input type="text" id="family-name" placeholder="e.g. Doe">
    <label for="family-name">Family Name</label>
  </fieldset>

  <fieldset class="form-field s12 m4">
    <legend>Birth month</legend>
    <input type="text" id="birth-month" placeholder="e.g. April" required>
    <label for="birth-month">Birth month</label>
  </fieldset>
</div>
```

- `.animated` animates the label; without it the label snaps.
- The `<legend>` reserves the notch in the border — keep its text identical to the label.
- `for` / `id` must match.
- Grid span classes (`s12 m4`) go straight on the `<fieldset>`.
- Disable by putting `disabled` on the `<fieldset>`.

Tunable via custom properties (defined on `:root`, override anywhere):

```
--mw-font-size: 16px          --mw-border-radius: 8px
--mw-input-height: 56px       --mw-border-width: 1px
--mw-idle-color               --mw-hover-color
--mw-focus-color              --mw-focus-border-width: 2px
--mw-disabled-color           --mw-padding-left: 16px
--mw-inputlabel-duration: .2s
```

```css
:root { --mw-border-radius: 4px; --mw-focus-color: var(--md-sys-color-tertiary); }
```

The same wrapper works for `<select>`, autocomplete and other controls.

## Text fields — the legacy `input-field` pattern

Still supported, and what most Materialize examples show.

> **Don't mix `form-field` and `input-field` in the same form.** They are two different design languages *and* two different heights, and cannot be visually aligned without overriding one:
>
> | | Style | Height |
> |---|---|---|
> | `fieldset.form-field` | MD3 outlined, notched legend | `56px` — explicit, `--mw-input-height` |
> | `div.input-field` | filled, bottom-border only | **no height rule at all** — browser default plus `padding-top: 20px`, roughly 41px |
>
> Sitting side by side in a row, the `input-field` looks short and visibly out of place. Pick one pattern per form; `form-field` is the v2 default. Everything that goes in an `.input-field` — datepicker, timepicker, autocomplete, select, character counter — works unchanged inside a `fieldset.form-field`:
>
> ```html
> <fieldset class="form-field animated s12 m4">
>   <legend>Start date</legend>
>   <input type="text" id="start" class="datepicker" placeholder=" ">
>   <label for="start">Start date</label>
> </fieldset>
> ```
>
> If you must keep `.input-field`, give it a matching height yourself:
> `.input-field input { height: 56px; }`

> **`placeholder=" "` is required here too.** v2 floats the label with this selector (`dist/css/materialize.css:6996`):
>
> ```css
> .input-field input:focus:not([readonly]) + label,
> .input-field input:not([placeholder=" "]) + label,
> .input-field input:not(:placeholder-shown) + label { transform: scale(0.75); top: 8px; }
> ```
>
> The middle clause means an input with **no `placeholder` attribute at all** matches `:not([placeholder=" "])`, so its label is stuck in the raised position over an empty field. This is a v2 behaviour change — in v1 the label floated purely on value, and omitting the placeholder was correct.

```html
<div class="row">
  <div class="input-field s6">
    <input id="email" type="email" class="validate" placeholder=" ">
    <label for="email">Email</label>
    <span class="supporting-text" data-error="Invalid address"></span>
  </div>
</div>
```

To show a real placeholder *and* a floating label, use `form-field` instead — with `.input-field`, any placeholder other than `" "` pins the label up.

**Icons** — `.prefix` / `.suffix` beside the input:

```html
<div class="input-field s12">
  <i class="material-icons prefix">account_circle</i>
  <input id="name" type="text" placeholder=" ">
  <label for="name">Name</label>
</div>
```

**Textarea** — `.materialize-textarea` auto-resizes:

```html
<div class="input-field s12">
  <textarea id="notes" class="materialize-textarea" placeholder=" "></textarea>
  <label for="notes">Notes</label>
</div>
```

**Outlined variant** — `.outlined` on the wrapper gives the MD3 notched-outline treatment (1px border, 2px on focus, label lifted to `top: -8px`):

```html
<div class="input-field outlined s12">
  <input id="company" type="text" placeholder=" ">
  <label for="company">Company</label>
</div>
```

**Error state** — `.error` on the wrapper turns the border and label `--md-sys-color-error`:

```html
<div class="input-field error s12">
  <input id="phone" type="tel" class="validate" placeholder=" ">
  <label for="phone">Phone</label>
  <span class="supporting-text" data-error="Required"></span>
</div>
```

`.error` is a presentational state you toggle yourself — `.validate` manages `.invalid` on the *input*, while `.error` sits on the *wrapper*:

```ts
inputEl.addEventListener('invalid', (e) => {
  (e.target as HTMLElement).closest('div.input-field')?.classList.add('error');
});
```

Other modifiers: `.inline` (inline layout), `.searchbar`, and `.prefix` / `.suffix` for icons.

> `.helper-text` from v1 no longer exists — use `.supporting-text`.

## Validation

Add `.validate` to the input. `Forms.validateField()` reads it and toggles `.invalid` based on the native Constraint Validation API (`input.validity`), plus any `data-length` limit.

```html
<input id="url" type="url" class="validate" required>
<label for="url">Website</label>
<span class="supporting-text" data-error="Not a valid URL"></span>
```

Only `data-error` is wired up in v2's CSS — v1's `data-success` counterpart was dropped.

`.validate` is a **JS hook with no CSS of its own**; `.invalid` carries the styling. Validation runs on the standard input events — you can also trigger it directly:

```ts
M.Forms.validateField(document.querySelector<HTMLInputElement>('#url')!);
```

## Character counter

`data-length` sets the limit; the counter element is `.character-counter`. `CharacterCounter` takes no options and is applied automatically.

```html
<fieldset class="form-field animated s12 m6">
  <legend>Title</legend>
  <input id="title" type="text" data-length="60" placeholder=" ">
  <label for="title">Title</label>
</fieldset>
```

## Select

Materialize replaces the native control with a generated wrapper.

> **Do not wrap a `<select>` in `.input-field`.** `FormSelect` builds its own wrapper carrying **both** classes — `select-wrapper input-field` (`components/textfield/select.ts:185`). Adding your own `.input-field` nests one inside the other, which double-draws the border and misplaces the floating label. This is the single most common v2 select mistake, because every v1 example uses `.input-field`.

Use `fieldset.form-field`, which is what the library's own reference page does:

```html
<fieldset class="form-field animated s12 m4">
  <legend>Fruit</legend>
  <select id="fruit">
    <option value="" disabled selected>Choose an option</option>
    <option value="1">Apple</option>
    <option value="2">Pear</option>
  </select>
  <label for="fruit">Fruit</label>
</fieldset>
```

A bare `<select>` with no wrapper at all also works — the generated `.select-wrapper.input-field` supplies the field styling on its own.

The generated structure is `div.select-wrapper.input-field` → `svg.caret` + `input.select-dropdown.dropdown-trigger` + `ul.dropdown-content.select-dropdown` + `div.hide-select` (holding the real `<select>`). Never author that markup by hand; style it by targeting those classes.

Multi-select, groups and native passthrough:

```html
<select multiple>…</select>

<select>
  <optgroup label="Team 1">
    <option value="1">Member A</option>
  </optgroup>
</select>

<select class="browser-default">…</select>   <!-- untouched native control -->
```

`.browser-default` opts out entirely. Note the AutoInit selector for `FormSelect` is `select` — **every** select on the page is enhanced unless it carries `browser-default` or `no-autoinit`.

| Option | Type | Default |
|---|---|---|
| `classes` | string | `''` |
| `dropdownOptions` | `Partial<DropdownOptions>` | `{}` |

Methods: `getSelectedValues()` → `string[]`, `destroy()`. Properties: `isMultiple`, `wrapper`, `input`, `dropdown`.

```ts
const select = M.FormSelect.init(document.querySelector('select')!, {
  dropdownOptions: { coverTrigger: false }
});
console.log(select.getSelectedValues());
```

## Checkboxes

`<label>` wraps the input and a `<span>` holding the text. The `<span>` is required — it draws the box.

```html
<p><label><input type="checkbox"><span>Default</span></label></p>
<p><label><input type="checkbox" checked><span>Checked</span></label></p>
<p><label><input type="checkbox" class="filled-in" checked><span>Filled in</span></label></p>
<p><label><input type="checkbox" disabled><span>Disabled</span></label></p>
```

## Radio buttons

```html
<p><label><input name="group1" type="radio" checked><span>Option 1</span></label></p>
<p><label><input name="group1" type="radio"><span>Option 2</span></label></p>
<p><label><input name="group1" type="radio" class="with-gap"><span>With gap</span></label></p>
```

## Switches

```html
<div class="switch">
  <label>
    Off
    <input type="checkbox">
    <span class="lever"></span>
    On
  </label>
</div>
```

`.lever` is required.

## Range slider

`Range` self-initializes on every `input[type=range]`.

```html
<p class="range-field">
  <input type="range" id="volume" min="0" max="100" value="40">
</p>
```

## File input

```html
<div class="file-field input-field">
  <div class="btn filled">
    <span>File</span>
    <input type="file">
  </div>
  <div class="file-path-wrapper">
    <input class="file-path validate" type="text" placeholder="Upload a file">
  </div>
</div>
```

Add `multiple` to the file input for multi-upload.

## Autocomplete

```html
<fieldset class="form-field animated s12">
  <legend>City</legend>
  <input type="text" id="city" class="autocomplete" placeholder=" ">
  <label for="city">City</label>
</fieldset>
```

```ts
M.Autocomplete.init(document.querySelector('#city')!, {
  data: [
    { id: 1, text: 'Berlin' },
    { id: 2, text: 'Paris' },
    { id: 3, text: 'Tokyo', image: 'tokyo.jpg' }
  ],
  minLength: 2,
  onAutocomplete: (entries) => console.log(entries)
});
```

Data entries are `{ id: string | number; text?: string; image?: string }`.

| Option | Type | Default |
|---|---|---|
| `data` | `AutocompleteData[]` | `[]` |
| `onAutocomplete` | function | `null` |
| `dropdownOptions` | object | `{ autoFocus: false, closeOnClick: false, coverTrigger: false }` |
| `minLength` | number | `1` |
| `isMultiSelect` | boolean | `false` |
| `onSearch` | `(text, autocomplete) => void` | case-insensitive substring filter |
| `maxDropDownHeight` | string | `'300px'` |
| `allowUnsafeHTML` | boolean | `false` |
| `selected` | array | `[]` |

Methods: `open()`, `close()`, `setMenuItems(items)`, `destroy()`.

Override `onSearch` for remote lookups — call `autocomplete.setMenuItems()` when results arrive:

```ts
M.Autocomplete.init(el, {
  onSearch: async (text, autocomplete) => {
    const res = await fetch(`/api/cities?q=${encodeURIComponent(text)}`);
    autocomplete.setMenuItems(await res.json());
  }
});
```

Leave `allowUnsafeHTML` at `false` unless the data is trusted — it controls whether entry text is injected as HTML.

## Chips

`Chips` self-initializes on `.chips`.

```html
<div class="chips"></div>
```

Static chip markup:

```html
<div class="chip">
  Tag
  <i class="material-icons close">close</i>
</div>
```

| Option | Type | Default |
|---|---|---|
| `data` | `ChipData[]` | `[]` |
| `placeholder` | string | `''` |
| `secondaryPlaceholder` | string | `''` |
| `closeIconClass` | string | `'material-icons'` |
| `autocompleteOptions` | object | `{}` |
| `autocompleteOnly` | boolean | `false` |
| `limit` | number | `Infinity` |
| `allowUserInput` | boolean | `false` |
| `onChipAdd` / `onChipSelect` / `onChipDelete` | function | `null` |

`ChipData` is `{ id: string | number; text?: string; image?: string }`.

**`allowUserInput` defaults to `false`** — without it users cannot type new chips, which is a common surprise.

```ts
M.Chips.init(document.querySelector('.chips')!, {
  allowUserInput: true,
  placeholder: 'Add a tag',
  secondaryPlaceholder: '+Tag',
  limit: 5,
  onChipAdd: (e, chip) => console.log('added', chip)
});
```

Methods: `addChip(data)`, `selectChip(index)`, `getData()`, `destroy()`.

## Datepicker

```html
<fieldset class="form-field animated s12 m6">
  <legend>Start date</legend>
  <input type="text" id="start" class="datepicker" placeholder=" ">
  <label for="start">Start date</label>
</fieldset>
```

```ts
M.Datepicker.init(document.querySelector('.datepicker')!, {
  displayPlugin: 'docked',
  format: 'yyyy-mm-dd',
  firstDay: 1,
  minDate: new Date(2026, 0, 1),
  showClearBtn: true,
  onSelect: (date) => console.log(date)
});
```

Common options (full list in `components/datepicker/datepicker.ts`):

| Option | Type | Default |
|---|---|---|
| `format` | string | `'mmm dd, yyyy'` |
| `firstDay` | number | `0` (Sunday) |
| `minDate` / `maxDate` | Date | `null` |
| `yearRange` | number \| `[from, to]` | `10` |
| `defaultDate` | Date | `null` |
| `setDefaultDate` | boolean | `false` |
| `isDateRange` | boolean | `false` |
| `dateRangeEndEl` | selector | `null` |
| `isMultipleSelection` | boolean | `false` |
| `disableWeekends` | boolean | `false` |
| `disableDayFn` | `(date) => boolean` | `null` |
| `showClearBtn` | boolean | `false` |
| `autoSubmit` | boolean | `true` |
| `openByDefault` | boolean | `false` |
| `container` | element | `null` |
| `showMonthAfterYear` | boolean | `false` |
| `showDaysInNextAndPreviousMonths` | boolean | `false` |
| `isRTL` | boolean | `false` |
| `i18n` | object | English labels |
| `events` | array | `[]` |
| `onSelect` / `onDraw` / `onConfirm` / `onCancel` / `onInputInteraction` | function | `null` |
| `displayPlugin` | `'modal' \| 'docked'` | `null` — **required for popup behaviour** |

`i18n` covers `cancel`, `clear`, `done`, `previousMonth`, `nextMonth`, `months`, `monthsShort`, `weekdays`, `weekdaysShort`, `weekdaysAbbrev`.

Date ranges pair two inputs:

```ts
M.Datepicker.init(startEl, { isDateRange: true, dateRangeEndEl: '#end' });
```

## Timepicker

```html
<fieldset class="form-field animated s12 m6">
  <legend>Time</legend>
  <input type="text" id="time" class="timepicker" placeholder=" ">
  <label for="time">Time</label>
</fieldset>
```

| Option | Type | Default |
|---|---|---|
| `defaultTime` | `'now'` or `'13:14'` | `'now'` |
| `fromNow` | number (ms offset) | `0` |
| `twelveHour` | boolean | `true` |
| `vibrate` | boolean | `true` |
| `showClearBtn` | boolean | `false` |
| `autoSubmit` | boolean | `true` |
| `duration` | number | `350` |
| `container` | element | `null` |
| `dialRadius` / `outerRadius` / `innerRadius` / `tickRadius` | number | `135` / `105` / `70` / `20` |
| `i18n` | object | `{ cancel: 'Cancel', clear: 'Clear', done: 'Ok' }` |
| `onSelect` / `onDone` / `onCancel` / `onInputInteraction` | function | `null` |
| `displayPlugin` | `'modal' \| 'docked'` | `null` — **required for popup behaviour** |

```ts
M.Timepicker.init(document.querySelector('.timepicker')!, {
  displayPlugin: 'docked',
  twelveHour: false,
  defaultTime: '09:30',
  onSelect: (hour, minute) => console.log(hour, minute)
});
```

## Picker display plugins — required for popup behaviour

> **A picker without `displayPlugin` does not pop up.** This is the most surprising v2 datepicker behaviour and it looks like a broken widget.

`displayPlugin` takes a **string**, `'modal'` or `'docked'`, and defaults to `null`. With the default:

- no plugin is constructed, so `_handleInputClick` reaches `if (this.displayPlugin) this.displayPlugin.show()` and does nothing;
- the calendar is still built and inserted into the DOM via `appendTo.parentElement.after(this.containerEl)`, and `.datepicker-container` is `display: flex` — so it renders **inline and permanently visible**, not on click.

It gets worse inside a grid: the container is inserted as a sibling of the field wrapper, which makes it a direct child of `.row`. With no span class it takes `grid-column: auto` — a single 1/12 track — and collapses into an unusable sliver.

**Use `'docked'`.** It wraps the calendar in a `.display-docked` element (`position: absolute; z-index: 9999`) inside the field wrapper and, on click, positions it directly beneath the input via `Utils._setAbsolutePosition(el, container, 'bottom', …)` — the behaviour people expect from a date field.

```ts
M.Datepicker.init(document.querySelectorAll('.datepicker'), {
  displayPlugin: 'docked'
});

M.Timepicker.init(document.querySelectorAll('.timepicker'), {
  displayPlugin: 'docked'
});
```

`M.AutoInit()` uses the defaults, so pickers need an explicit init pass (or per-component options) even in an AutoInit page:

```ts
M.AutoInit(document.body, {
  Datepicker: { displayPlugin: 'docked' },
  Timepicker: { displayPlugin: 'docked' }
});
```

Because `.display-docked` is absolutely positioned, its offset parent must be positioned. `fieldset.form-field` and `div.input-field` are both `position: relative`, and neither clips overflow, so it works in either wrapper.

> **`'modal'` is broken in 2.3.3.** `ModalDisplayPlugin.show()` sets the `open` **attribute** instead of calling `dialog.showModal()`, so the `<dialog>` never enters the top layer. `.modal` declares no `position`, so the UA default `position: absolute` applies — and since the plugin appends the dialog to `document.body`, the picker renders at its static position **below all page content** rather than over it. It looks like the picker simply didn't open.
>
> `assets/materialize-v2-fixes.css` contains a `.modal.display-modal[open]` centering rule if you need the modal presentation. Otherwise prefer `'docked'`.

`displayPluginOptions` is forwarded to the chosen plugin. `'modal'` additionally moves the picker's footer into the modal chrome.

## A complete form

```html
<form class="container">
  <div class="row">
    <fieldset class="form-field animated s12 m6">
      <legend>Full name</legend>
      <input type="text" id="fullname" placeholder=" " required>
      <label for="fullname">Full name</label>
    </fieldset>

    <fieldset class="form-field animated s12 m6">
      <legend>Email</legend>
      <input type="email" id="email" class="validate" placeholder=" " required>
      <label for="email">Email</label>
    </fieldset>
  </div>

  <div class="row">
    <fieldset class="form-field animated s12 m6">
      <legend>Plan</legend>
      <select id="plan">
        <option value="" disabled selected>Choose a plan</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>
      <label for="plan">Plan</label>
    </fieldset>

    <fieldset class="form-field animated s12 m6">
      <legend>Start date</legend>
      <input type="text" id="starts" class="datepicker" placeholder=" ">
      <label for="starts">Start date</label>
    </fieldset>
  </div>

  <div class="row">
    <p><label><input type="checkbox" class="filled-in" required><span>I agree to the terms</span></label></p>
  </div>

  <button class="btn filled waves-effect" type="submit">
    Submit<i class="material-icons icon-right">send</i>
  </button>
</form>
```

```ts
M.AutoInit();
```

## Known upstream bugs

Confirmed defects in v2.3.3 itself. `assets/materialize-v2-fixes.css` patches the two that markup can't. Re-check on upgrade.

### Checkbox and radio label text touches the box

`components/checkbox/_checkboxes.scss` opens a block comment at line 89 that is never closed, so the label-spacing rule never compiles:

```scss
/*
// Checkbox Styles
[type="checkbox"] {
  + span:not(.lever) {
    padding-left: var(--checkbox-size);   // never reaches the output
```

The stray `/*` even survives into `dist/css/materialize.css`. The input draws its own box via `:before`/`:after` with `appearance: none; margin: 0`, so the adjacent `<span>` has no offset and the text sits flush.

The markup is correct as documented above — only the stylesheet is at fault. Fix:

```css
input[type='checkbox'] + span:not(.lever),
input[type='radio'] + span:not(.lever) {
  padding-left: 8px;
}
```

### The chips input renders as a full-width bordered field

`components/chip/chips.css` misspells its selector as `.chis` instead of `.chips`, and the typo ships in `dist/css/materialize.css` at lines 4359 and 4379:

```css
.chis input:not([type]):not(.browser-default).input { … }
```

So the chip entry input never picks up its styling and falls back to Materialize's global `input` rules — full width, bordered, `3rem` tall. Only visible with `allowUserInput: true`. Fix: re-declare the same block with `.chips`.

### `<select>` double-wrapping

Not a library bug but the most common authoring mistake — see the [Select](#select) section. `FormSelect` generates `select-wrapper input-field`, so wrapping it in your own `.input-field` nests two field wrappers.
