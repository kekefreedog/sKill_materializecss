# TypeScript & JavaScript — Materialize v2.3.3

Materialize v2 is written in TypeScript and ships `dist/js/materialize.d.ts`. There is **no jQuery integration** — none of the `$('.x').plugin()` forms exist.

## Installation and entry points

```bash
npm install @materializecss/materialize
```

| Field | Path |
|---|---|
| `main` (CJS) | `dist/js/materialize.js` |
| `module` (ESM) | `dist/js/materialize.mjs` |
| `typings` | `dist/js/materialize.d.ts` |
| `style` | `dist/css/materialize.css` |
| `sass` | `sass/materialize.scss` |

Subpath exports: `./dist/css/*`, `./sass/*`, `./components/*`.

Only runtime dependency is `normalize.css`.

## Importing

```ts
// named
import { AutoInit, Dropdown, Sidenav, Toast } from '@materializecss/materialize';

// namespace
import * as M from '@materializecss/materialize';

// styles
import '@materializecss/materialize/dist/css/materialize.min.css';
```

Sass, if you want to override variables:

```scss
@use '@materializecss/materialize/sass/materialize';
```

Browser (no bundler) — the IIFE build sets the global `M`:

```html
<script src="https://cdn.jsdelivr.net/npm/@materializecss/materialize@2.3.3/dist/js/materialize.min.js"></script>
<script>M.AutoInit();</script>
```

## The exported surface

```ts
export {
  AutoInit, Autocomplete, Cards, Carousel, CharacterCounter, Chips, Collapsible,
  Datepicker, Dropdown, FloatingActionButton, FormSelect, Forms, Materialbox,
  Modal, Parallax, Pushpin, Range, ScrollSpy, Sidenav, Slider, Tabs, TapTarget,
  Timepicker, Toast, Tooltip, Waves, version
};
export type { AutoInitOptions };
```

## Option types are not exported

The 25 `*Options` interfaces (`DropdownOptions`, `SidenavOptions`, …) are **declared in the `.d.ts` but not exported**. `import type { DropdownOptions }` fails to compile. `AutoInitOptions` is the only exported type.

Because `AutoInitOptions` references them structurally, you can recover any of them:

```ts
import type { AutoInitOptions } from '@materializecss/materialize';

type DropdownOptions = NonNullable<AutoInitOptions['Dropdown']>;  // Partial<DropdownOptions>
type SidenavOptions  = NonNullable<AutoInitOptions['Sidenav']>;

const dropdownConfig: DropdownOptions = { hover: true, coverTrigger: false };
```

This works for every component in the AutoInit registry. For the rest (`Slider`, `Toast`, `CharacterCounter`), infer from the call site or the static defaults:

```ts
import { Slider, Toast } from '@materializecss/materialize';

type SliderOptions = Parameters<typeof Slider.init>[1];
type ToastOptions  = ConstructorParameters<typeof Toast>[0];
```

## Initialization patterns

```ts
import { AutoInit, Dropdown, Sidenav, Tabs } from '@materializecss/materialize';

// everything at once
AutoInit();

// scoped, with per-component options
AutoInit(document.querySelector<HTMLElement>('#app')!, {
  Dropdown: { hover: true },
  Sidenav: { edge: 'right' }
});

// single element → single instance
const sidenav = Sidenav.init(document.querySelector<HTMLElement>('.sidenav')!);
sidenav.open();

// NodeList → array of instances
const dropdowns = Dropdown.init(
  document.querySelectorAll<HTMLElement>('.dropdown-trigger'),
  { coverTrigger: false }
);
dropdowns.forEach((d) => d.close());
```

`init` is overloaded, so the return type follows the argument — a single `HTMLElement` gives `T`, a `NodeList`/`HTMLCollection` gives `T[]`. Keep the `HTMLElement` generic on `querySelector` so the right overload is picked.

### Retrieving and destroying

```ts
const el = document.querySelector<HTMLElement>('.tabs')!;
const tabs = Tabs.getInstance(el);
tabs?.select('tab2');
tabs?.destroy();
```

`getInstance` reads a property the constructor stores on the element (`el['M_Tabs']`), so it is cheap. Constructing over an existing instance destroys the old one automatically.

## Self-initializing components

`Forms`, `Chips`, `Waves`, `Range` and `Cards` call their own `Init()` when the module is evaluated. Do **not** initialize them yourself:

```ts
// wrong — already running
Waves.Init();
Range.Init();
```

The module also registers document-level `keydown`, `keyup`, `focus` and `blur` listeners at import time.

Opt a single element out of `AutoInit()` with `class="no-autoinit"`.

## Strict-mode notes

`querySelector` returns `Element | null`, but `init` wants `HTMLElement`. Two safe options:

```ts
const el = document.querySelector<HTMLElement>('.sidenav');
if (el) Sidenav.init(el);

// or assert when the element is guaranteed by the template
Sidenav.init(document.querySelector<HTMLElement>('.sidenav')!);
```

For `<dialog>`, use the specific element type so `showModal()` type-checks:

```ts
const dialog = document.querySelector<HTMLDialogElement>('#modal1')!;
dialog.showModal();
```

## Callbacks and `this`

Callbacks are invoked with the instance as `this`, so use a `function` expression if you need it. Arrow functions capture the enclosing `this` instead:

```ts
Sidenav.init(el, {
  onOpenEnd: function () {
    console.log(this.isOpen); // instance
  }
});
```

Prefer closing over the instance variable — it types better than `this`:

```ts
const sidenav = Sidenav.init(el, {
  onCloseEnd: () => console.log(sidenav.isOpen)
});
```

## Framework integration

Materialize mutates the DOM directly, so initialize after render and tear down before unmount.

**React:**

```tsx
import { useEffect, useRef } from 'react';
import { Dropdown } from '@materializecss/materialize';

export function Menu() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const instance = Dropdown.init(ref.current, { coverTrigger: false });
    return () => instance.destroy();
  }, []);

  return <a ref={ref} className="btn dropdown-trigger" data-target="dd1">Menu</a>;
}
```

**Vue:**

```ts
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { Sidenav } from '@materializecss/materialize';

const el = ref<HTMLElement | null>(null);
let instance: Sidenav | null = null;

onMounted(() => { if (el.value) instance = Sidenav.init(el.value); });
onBeforeUnmount(() => instance?.destroy());
```

Re-initialize after any list that Materialize enhanced changes (for example a `<select>` whose `<option>`s were replaced) — destroy first, then init again.

## SSR

The bundle touches `document` at import time (guarded by `typeof document !== 'undefined'`, so importing is safe), but component init needs a real DOM. Initialize in a client-only lifecycle hook — `useEffect`, `onMounted`, or a dynamic import.

## Theming from code

```ts
type Theme = 'light' | 'dark';

const setTheme = (t: Theme) => document.documentElement.setAttribute('theme', t);
const clearTheme = () => document.documentElement.removeAttribute('theme'); // follow OS
```

## Version

```ts
import { version } from '@materializecss/materialize'; // '2.3.3'
```
