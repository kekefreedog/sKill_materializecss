# Components — Materialize v2.3.3

This reference describes stock Materialize v2. For the kmaterialize fork, apply [kmaterialize.md](kmaterialize.md) first; enhanced forms and reusable extensions have dedicated references linked there.

Every class here exists in `dist/css/materialize.css`; every option and default is taken from the component's `_defaults` in the v2 TypeScript source. Form controls live in `forms.md`.

**Common API.** Each component extends a shared base:

```ts
M.Component.init(elOrNodeList, options)  // one element → instance; NodeList → instance[]
M.Component.getInstance(el)              // retrieve
M.Component.defaults                     // default options
instance.destroy()                       // teardown
```

Re-initializing an element destroys the previous instance first.

---

## Buttons

CSS only, no init.

```html
<button class="btn filled">Filled</button>
<button class="btn tonal">Tonal</button>
<button class="btn elevated">Elevated</button>
<button class="btn outlined">Outlined</button>
<button class="btn text">Text</button>
```

Modifiers: `btn-small`, `btn-large`, `btn-block` (full width), `rounded`, `disabled`.

Icons use `icon-left` / `icon-right` on the button:

```html
<button class="btn filled icon-left">
  <i class="material-icons">cloud</i>Upload
</button>
```

`.btn-flat` is retained as an alias of `.btn.text`.

### Ripple

Opt in with `waves-effect`. It is **JavaScript-driven** — there is no `.waves-*` CSS — and only two modifiers are read:

- `waves-light` → white ripple (use on dark backgrounds)
- `waves-circle` → circular ripple, for round targets

```html
<button class="btn filled waves-effect waves-light">Save</button>
```

Colour variants from v1 (`waves-teal`, `waves-red`, `waves-block`) are ignored.

## Floating Action Button

```html
<div class="fixed-action-btn">
  <a class="btn-floating btn-large">
    <i class="large material-icons">mode_edit</i>
  </a>
  <ul>
    <li><a class="btn-floating"><i class="material-icons">insert_chart</i></a></li>
    <li><a class="btn-floating"><i class="material-icons">format_quote</i></a></li>
  </ul>
</div>
```

Variants: `<div class="fixed-action-btn horizontal">`, `<div class="fixed-action-btn toolbar">`.

**Class is `FloatingActionButton`** (auto-init selector `.fixed-action-btn`).

| Option | Type | Default |
|---|---|---|
| `direction` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'top'` |
| `hoverEnabled` | boolean | `true` |
| `toolbarEnabled` | boolean | `false` |

Methods: `open()`, `close()`, `destroy()`.

```ts
M.FloatingActionButton.init(document.querySelectorAll('.fixed-action-btn'), {
  direction: 'left',
  hoverEnabled: false
});
```

## Cards

```html
<div class="card">
  <div class="card-image">
    <img src="image.jpg" alt="">
    <span class="card-title">Card Title</span>
    <a class="btn-floating halfway-fab"><i class="material-icons">add</i></a>
  </div>
  <div class="card-content">
    <p>Card body text.</p>
  </div>
  <div class="card-action">
    <a href="#">Action</a>
  </div>
</div>
```

**Horizontal** — the `.card-stacked` wrapper is required:

```html
<div class="card horizontal">
  <div class="card-image"><img src="image.jpg" alt=""></div>
  <div class="card-stacked">
    <div class="card-content"><p>Text</p></div>
    <div class="card-action"><a href="#">Action</a></div>
  </div>
</div>
```

**Reveal** — clicking `.activator` slides `.card-reveal` up:

```html
<div class="card">
  <div class="card-image"><img class="activator" src="image.jpg" alt=""></div>
  <div class="card-content">
    <span class="card-title activator">More<i class="material-icons right">more_vert</i></span>
  </div>
  <div class="card-reveal">
    <span class="card-title">More<i class="material-icons right">close</i></span>
    <p>Revealed content.</p>
  </div>
</div>
```

**Card panel** — simple padded surface: `<div class="card-panel">…</div>`

Sizes: `card small`, `card medium`, `card large`. Also `card sticky-action`.

`Cards` **self-initializes** — do not call `M.Cards.init()`. Options exist for the reveal animation:

| Option | Type | Default |
|---|---|---|
| `onOpen` | function | `null` |
| `onClose` | function | `null` |
| `inDuration` | number | `225` |
| `outDuration` | number | `300` |

> `.card-tabs` from v1 does not exist in v2. Put a `.tabs` element inside `.card-content` instead.

## Navbar

The class is `.navbar` — **`.nav` is not a class in v2.**

```html
<nav class="navbar">
  <div class="nav-wrapper container">
    <a href="#" class="brand-logo">Logo</a>
    <ul class="ml-auto">
      <li class="hide-on-large-only">
        <a href="#" data-target="mobile-nav" class="sidenav-trigger">
          <i class="material-icons">menu</i>
        </a>
      </li>
      <li class="hide-on-med-and-down"><a href="#">Components</a></li>
      <li class="hide-on-med-and-down"><a href="#">Docs</a></li>
    </ul>
  </div>
</nav>
```

Two v2 traps in this markup, both silent:

**Put every link inside `<ul><li>`.** `.nav-wrapper` is `display: flex`, and appbar.css only colours three things — `.navbar ul:not(.dropdown-content) > li > a`, `.brand-logo` and `.nav-title`. A bare `<a class="sidenav-trigger">` dropped straight into `.nav-wrapper` gets no colour (it falls back to the global link colour) and no spacing (the `gap: 1em` lives on the `ul`).

**Use `ml-auto`, not `.right`.** `.right` is `float: right !important`, and floats do nothing to a flex item, so the v1 alignment idiom is inert in v2. `ml-auto` (`margin-left: auto`) is the flex equivalent.

**Add `container` to `.nav-wrapper`.** It only has `padding: 0 4px`, so a full-bleed navbar clips the brand against the left edge and jams the last link against the right. `class="nav-wrapper container"` keeps the bar full-width while constraining its contents to the page gutter.

`navbar-fixed` pins it. Height is `--navbar-height` (64px) / `--navbar-height-mobile` (56px); title size is `--appbar-title-font-size` (24px). `.nav-title` is available for a larger heading.

v2 ships no documented mobile-nav pattern of its own — the Storybook stories omit the trigger entirely — so the structure above is derived from the CSS rules rather than copied from an upstream example.

## Sidenav

```html
<ul id="mobile-nav" class="sidenav">
  <li><a href="#">Home</a></li>
  <li><div class="divider"></div></li>
  <li><a class="subheader">Section</a></li>
  <li><a href="#">Settings</a></li>
</ul>
```

The trigger's `data-target` must match the sidenav's `id`:

```html
<a href="#" data-target="mobile-nav" class="sidenav-trigger"><i class="material-icons">menu</i></a>
```

Add `sidenav-fixed` to keep it open on large screens. `.user-view` styles a profile header block.

| Option | Type | Default |
|---|---|---|
| `edge` | `'left' \| 'right'` | `'left'` |
| `draggable` | boolean | `true` |
| `dragTargetWidth` | string | `'10px'` |
| `inDuration` | number | `250` |
| `outDuration` | number | `200` |
| `preventScrolling` | boolean | `true` |
| `onOpenStart` / `onOpenEnd` / `onCloseStart` / `onCloseEnd` | function | `null` |

Methods: `open()`, `close()`, `destroy()`. Property: `isOpen`.

```ts
const sidenav = M.Sidenav.init(document.querySelector('.sidenav')!, { edge: 'right' });
sidenav.open();
```

## Dropdown

The trigger carries the class and points at the content by id:

```html
<a class="btn dropdown-trigger" data-target="dd1">Menu</a>

<ul id="dd1" class="dropdown-content">
  <li><a href="#">One</a></li>
  <li class="divider" tabindex="-1"></li>
  <li><a href="#">Two</a></li>
</ul>
```

| Option | Type | Default |
|---|---|---|
| `alignment` | `'left' \| 'right'` | `'left'` |
| `autoFocus` | boolean | `true` |
| `constrainWidth` | boolean | `true` |
| `container` | element | `null` |
| `coverTrigger` | boolean | `true` |
| `closeOnClick` | boolean | `true` |
| `hover` | boolean | `false` |
| `inDuration` | number | `150` |
| `outDuration` | number | `250` |
| `onOpenStart` / `onOpenEnd` / `onCloseStart` / `onCloseEnd` | function | `null` |
| `onItemClick` | `(el: HTMLLIElement) => void` | `null` |

Methods: `open()`, `close()`, `recalculateDimensions()`, `destroy()`.

## Tabs

```html
<ul class="tabs">
  <li class="tab"><a class="active" href="#tab1">Tab 1</a></li>
  <li class="tab"><a href="#tab2">Tab 2</a></li>
  <li class="tab"><a class="disabled" href="#tab3">Disabled</a></li>
</ul>

<div id="tab1">Panel one</div>
<div id="tab2">Panel two</div>
```

Modifiers: `tabs-fixed-width`, `tabs-transparent`, `tabs-horizontal`.

| Option | Type | Default |
|---|---|---|
| `duration` | number | `300` |
| `onShow` | `(newContent: Element) => void` | `null` |
| `swipeable` | boolean | `false` |
| `responsiveThreshold` | number | `Infinity` |

Methods: `select(tabId: string)`, `updateTabIndicator()`, `destroy()`.

```ts
const tabs = M.Tabs.init(document.querySelector('.tabs')!, { swipeable: true });
tabs.select('tab2');
```

## Collapsible

```html
<ul class="collapsible">
  <li>
    <div class="collapsible-header"><i class="material-icons">filter_drama</i>First</div>
    <div class="collapsible-body"><span>Content</span></div>
  </li>
  <li class="active">
    <div class="collapsible-header"><i class="material-icons">place</i>Second</div>
    <div class="collapsible-body"><span>Content</span></div>
  </li>
</ul>
```

Add `.popout` for the detached style. `li.active` starts expanded.

| Option | Type | Default |
|---|---|---|
| `accordion` | boolean | `true` |
| `inDuration` | number | `300` |
| `outDuration` | number | `300` |
| `onOpenStart` / `onOpenEnd` / `onCloseStart` / `onCloseEnd` | function | `null` |

**Methods take an index**, not a selector:

```ts
const c = M.Collapsible.init(document.querySelector('.collapsible')!, { accordion: false });
c.open(0);
c.close(0);
```

## Modal — native `<dialog>`

**`M.Modal` is a dead stub in v2.3.3.** `components/dialog/modal.ts` is marked *"Obsolete for versions > 2.1.1"*; `open()` and `close()` return `this` without doing anything and every event handler is empty. The CSS targets the native element.

```html
<button class="btn filled" id="open-modal">Open</button>

<dialog id="modal1" class="modal">
  <div class="modal-header"><h5>Title</h5></div>
  <div class="modal-content"><p>Body copy.</p></div>
  <div class="modal-footer">
    <button class="btn text modal-close">Cancel</button>
    <button class="btn filled">Agree</button>
  </div>
</dialog>
```

```ts
const modal = document.querySelector<HTMLDialogElement>('#modal1')!;

document.querySelector('#open-modal')?.addEventListener('click', () => modal.showModal());
modal.querySelector('.modal-close')?.addEventListener('click', () => modal.close());

// dismissible: click the backdrop to close
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});

modal.addEventListener('close', () => {
  console.log('returnValue:', modal.returnValue);
});
```

`.bottom-sheet` gives the slide-up-from-bottom variant. Style with `.modal[open]` and `.modal::backdrop`. Escape-to-close and focus trapping come free with `<dialog>`.

## Materialbox

Lightbox for images. Auto-init selector `.materialboxed`.

```html
<img class="materialboxed" src="image.jpg" alt="">
```

| Option | Type | Default |
|---|---|---|
| `inDuration` | number | `275` |
| `outDuration` | number | `200` |
| `onOpenStart` / `onOpenEnd` / `onCloseStart` / `onCloseEnd` | function | `null` |

Methods: `open()`, `close()`, `destroy()`.

## Carousel

```html
<div class="carousel">
  <a class="carousel-item" href="#one"><img src="1.jpg" alt=""></a>
  <a class="carousel-item" href="#two"><img src="2.jpg" alt=""></a>
</div>
```

Full-width slider mode uses `carousel carousel-slider` and pairs with `indicators: true`. `.carousel-fixed-item` pins content over the track.

| Option | Type | Default |
|---|---|---|
| `duration` | number | `200` |
| `dist` | number | `-100` |
| `shift` | number | `0` |
| `padding` | number | `0` |
| `numVisible` | number | `5` |
| `fullWidth` | boolean | `false` |
| `indicators` | boolean | `false` |
| `noWrap` | boolean | `false` |
| `onCycleTo` | function | `null` |

Methods: `next(n?)`, `prev(n?)`, `set(index)`, `destroy()`.

## Slider

Distinct from Carousel — a full-width image slideshow.

```html
<div class="slider">
  <ul class="slides">
    <li>
      <img src="1.jpg" alt="">
      <div class="caption center-align"><h3>Headline</h3></div>
    </li>
    <li><img src="2.jpg" alt=""></li>
  </ul>
</div>
```

| Option | Type | Default |
|---|---|---|
| `indicators` | boolean | `true` |
| `height` | number | `400` |
| `duration` | number | `500` |
| `interval` | number | `6000` |
| `pauseOnFocus` | boolean | `true` |
| `pauseOnHover` | boolean | `true` |
| `indicatorLabelFunc` | `(index, current) => string` | `null` |

Methods: `set(index)`, `destroy()`. Note `.slider` is **not** in the AutoInit registry — initialize it explicitly:

```ts
M.Slider.init(document.querySelectorAll('.slider'), { height: 500, indicators: true });
```

## Toasts

Constructed directly, not via `init()`:

```ts
new M.Toast({ text: 'Saved' });

new M.Toast({
  text: 'Deleted',
  displayLength: 6000,
  classes: 'rounded',
  completeCallback: () => console.log('gone')
});

M.Toast.dismissAll();
```

| Option | Type | Default |
|---|---|---|
| `text` | string | `''` |
| `displayLength` | number | `4000` |
| `inDuration` | number | `300` |
| `outDuration` | number | `375` |
| `classes` | string | `''` |
| `completeCallback` | function | `null` |
| `activationPercent` | number | `0.8` |

Method: `dismiss()`. Markup hooks: `.toast`, `.toast-action`.

## Tooltip

Auto-init selector `.tooltipped`; the rendered element is `.material-tooltip`.

```html
<button class="btn tooltipped" data-position="bottom" data-tooltip="Hello">Hover</button>
```

| Option | Type | Default |
|---|---|---|
| `exitDelay` | number | `200` |
| `enterDelay` | number | `0` |
| `text` | string | `''` |
| `margin` | number | `5` |
| `inDuration` | number | `250` |
| `outDuration` | number | `200` |
| `position` | `'top' \| 'right' \| 'bottom' \| 'left'` | `'bottom'` |
| `transitionMovement` | number | `10` |
| `opacity` | number | `1` |

Methods: `open(isManual?: boolean)`, `close()`, `destroy()`.

## Collections and lists

```html
<ul class="collection with-header">
  <li class="collection-header"><h4>Header</h4></li>
  <li class="collection-item">Item</li>
  <li class="collection-item active">Active item</li>
  <li class="collection-item">
    Item with action
    <a href="#" class="secondary-content"><i class="material-icons">send</i></a>
  </li>
</ul>
```

Links use `<a class="collection-item">`. Wrap in `<a class="collection">` variants as needed. CSS only.

## Badges

```html
<li>Notifications<span class="badge">4</span></li>
<li>Updates<span class="new badge" data-badge-caption="unread">2</span></li>
```

`.new` gives the filled treatment. CSS only.

## Breadcrumbs

```html
<div class="breadcrumb-wrapper">
  <a href="#" class="breadcrumb">Home</a>
  <a href="#" class="breadcrumb">Library</a>
  <a href="#" class="breadcrumb">Data</a>
</div>
```

## Pagination

```html
<ul class="pagination">
  <li class="disabled"><a href="#"><i class="material-icons">chevron_left</i></a></li>
  <li class="active"><a href="#">1</a></li>
  <li><a href="#">2</a></li>
  <li><a href="#"><i class="material-icons">chevron_right</i></a></li>
</ul>
```

## Preloaders and progress

**Circular:**

```html
<div class="preloader-wrapper active">
  <div class="spinner-layer spinner-blue-only">
    <div class="circle-clipper left"><div class="circle"></div></div>
    <div class="gap-patch"><div class="circle"></div></div>
    <div class="circle-clipper right"><div class="circle"></div></div>
  </div>
</div>
```

Sizes `small` / `big`; remove `active` to stop.

**Linear:**

```html
<div class="progress"><div class="indeterminate"></div></div>
<div class="progress"><div class="determinate" style="width: 70%"></div></div>
```

## Divider

```html
<div class="divider"></div>
```

## Tap Target (feature discovery)

```html
<div class="tap-target" data-target="menu-btn">
  <div class="tap-target-content">
    <h5>Title</h5>
    <p>Explanation of the feature.</p>
  </div>
</div>
```

| Option | Type | Default |
|---|---|---|
| `onOpen` | function | `null` |
| `onClose` | function | `null` |

Methods: `open()`, `close()`, `destroy()`.

## Scroll-driven components

**ScrollSpy** — highlights nav links for the section in view. Auto-init selector `.scrollspy` (JS-only, no CSS).

| Option | Type | Default |
|---|---|---|
| `throttle` | number | `100` |
| `scrollOffset` | number | `200` |
| `activeClass` | string | `'active'` |
| `getActiveElement` | `(id: string) => string` | returns `a[href="#{id}"]` |
| `keepTopElementActive` | boolean | `false` |
| `animationDuration` | number | `null` |

**Pushpin** — fixes an element within a scroll range.

| Option | Type | Default |
|---|---|---|
| `top` | number | `0` |
| `bottom` | number | `Infinity` |
| `offset` | number | `0` |
| `onPositionChange` | `(position: 'pinned' \| 'pin-top' \| 'pin-bottom') => void` | `null` |

Applies `.pinned`, `.pin-top` or `.pin-bottom`.

**Parallax:**

```html
<div class="parallax-container">
  <div class="parallax"><img src="bg.jpg" alt=""></div>
</div>
```

| Option | Type | Default |
|---|---|---|
| `responsiveThreshold` | number | `0` |

## Character counter

Attach with `data-length`; `CharacterCounter` takes no options.

```html
<input type="text" data-length="120">
```
