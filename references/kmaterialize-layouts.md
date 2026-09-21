# kmaterialize navigation, cards, timeline and footers

Use for layout and appearance beyond the stock v2 component reference. Verified source/release boundary: [kmaterialize.md](kmaterialize.md). These styles ship in the framework CSS; documentation pages contain examples, not replacement implementations.

## Navbar surfaces and content

```html
<nav class="navbar appbar" aria-label="Primary navigation">
  <div class="nav-wrapper">
    <a href="/" class="brand-logo">Workspace</a>
    <ul class="ml-auto"><li><a href="/projects">Projects</a></li></ul>
  </div>
</nav>
```

The default `.navbar` has square corners and no border. `.appbar` supplies structured MD3 layout. Add `.navbar-rounded` to `.navbar.appbar` for 16px corners, 4px padding and subtle shadow; simple rounded bars keep a 64px outer height and 56px inner bar. `.appbar-bordered` is an explicit border option and remains a backwards-compatible structured-layout alias. `.navbar-full` supplies the flush full-width variant.

For crowded navigation, `.navbar-wrap` permits additional rows; `.navbar-scroll` preserves a horizontal row with overflow controls. The exported `initNavbarScroll(navbar: HTMLElement)` helper takes a navbar and returns a cleanup function. Structured content uses `.nav-actions`, `.nav-separator`, `.nav-context` and `.brand-logo-image`. Prefer these hooks to arbitrary navbar height overrides.

### Hide while scrolling

Use `.navbar-hide-on-scroll`, initialized by `AutoInit`, or opt out with `.no-autoinit` and initialize explicitly:

```ts
import { NavbarAutoHide } from 'kmaterialize';
const nav = NavbarAutoHide.init(document.querySelector<HTMLElement>('#nav')!, {
  tolerance: 4,
  offset: 0,
  scrollTarget: null
});
// nav.destroy();
```

The navbar hides on downward scrolling and returns on upward scrolling, near the top, or when focus enters it. It uses sticky positioning and respects reduced motion; no Headroom dependency is required. `scrollTarget: HTMLElement` supports an independently scrolling panel. Put the navbar in the appropriate scrolling layout; a short wrapper can constrain a sticky element. Reserve space separately if application CSS changes it to fixed positioning.

### Tiny navbar

```html
<nav id="notice" class="navbar navbar-tiny no-autoinit" aria-label="Announcement">
  <div class="nav-wrapper"><p class="navbar-tiny-content">A preview is available.</p></div>
</nav>
```

```ts
import { TinyNavbar } from 'kmaterialize';
const notice = TinyNavbar.init(document.querySelector<HTMLElement>('#notice')!, {
  position: 'bottom',
  dismissible: true,
  closeLabel: 'Dismiss announcement'
});
notice.setPosition('top');
// notice.close(); notice.open(); notice.getPosition(); notice.isOpen; notice.destroy();
```

`position` accepts `inline` (default), `top`, or `bottom`. Markup-only AutoInit hooks are `.navbar-tiny-top`, `.navbar-tiny-bottom`, `.navbar-tiny-dismissible`. The close icon is generated; do not add a second one. `returnFocus` and `onClose` customize dismissal. Fixed variants honor safe-area insets and `--navbar-tiny-offset`; reserve content space in the application as needed. `isOpen` is a property, not a method.

## Cards

| Feature | Supported markup/behavior |
|---|---|
| Fixed sizes | `.card.small`, `.card.medium`, `.card.large`: 300/400/500px. Content scrolls and actions stay at the bottom. |
| Image sizing | `--card-image-height` defaults to 180px in sized cards; `--card-image-position` controls the crop. Sized horizontal cards use a 40% image column. |
| Title gradient | Put `.gradient` on `.card-image .card-title`, not the whole ordinary image card. The overlay is decorative; links remain usable. |
| Background image card | Put `.card-image-alt` on `.card`, set `background-image`; the framework supplies the overlay. Optional explicit child `.overlay` replaces the pseudo overlay without doubling it. |
| Background gradient | Put `.gradient` on `.card.card-image-alt`; content aligns toward the bottom. Optional `.card-action` retains a distinct card surface. |
| Badge overlay | `.card-badges` contains existing `.badge` elements; add `.left` to the group for left alignment. |

```html
<div class="card card-image-alt gradient" style="background-image: url('/images/city.jpg')">
  <div class="card-badges"><span class="badge">Featured</span></div>
  <div class="card-content">
    <span class="card-title">Discover the city</span>
    <p>A short description.</p>
  </div>
  <div class="card-action"><a href="/destinations">View destination</a></div>
</div>
```

Background cards default to a 186px minimum height; customize `--card-image-alt-height` and `--card-image-alt-overlay`. They also support the card size classes. Badges wrap inside the overlay; `--card-badge-background` / `--card-badge-color` customize their surface/text. Noninteractive badges do not intercept image clicks; badge links remain interactive. Use meaningful image alternatives in content when a CSS background conveys information.

## Timeline (CSS component)

```html
<ol class="timeline">
  <li class="timeline-event">
    <span class="timeline-badge" aria-hidden="true"><i class="material-icons">check</i></span>
    <article class="timeline-content card-panel">
      <h5>Approved</h5><p><time datetime="2026-10-01">October 1</time> — Ready to start.</p>
    </article>
  </li>
  <li class="timeline-event">
    <span class="timeline-badge" aria-hidden="true"></span>
    <article class="timeline-content card-panel"><h5>In progress</h5><p>Work has started.</p></article>
  </li>
</ol>
```

Events alternate around a central line on wide layouts. At 600px or less, including narrow containers, the layout becomes one column. `.timeline-left` forces one column at any width. Empty badges are 16px dots; icon badges default to 40px. The line stops 12px short of markers, including first/last event handling. It uses logical positions for RTL and needs no JS initialization.

Variables: `--timeline-marker-gap` (line-to-marker gap), `--timeline-gap` (content spacing), `--timeline-event-spacing`, `--timeline-badge-size`, `--timeline-line-width`, `--timeline-line-color`. Use existing background/text utility classes for marker tones.

## Footer layouts

```html
<body class="footer-layout footer-fixed">
  <header>Navigation</header>
  <main>Scrollable page content</main>
  <footer class="page-footer footer-bordered">
    <div class="container"><p>Project information</p></div>
    <div class="footer-copyright"><div class="container">Copyright</div></div>
  </footer>
</body>
```

`.footer-layout` keeps a footer at the bottom when content is short, with normal page scrolling when longer. Add `.footer-fixed` to keep it always visible while **main scrolls independently**. This uses flex rows that reserve the footer's actual height, not a fixed overlay requiring guessed bottom padding. Header/main/footer are direct children; custom panels may set `--footer-layout-height` instead of the default `100dvh`. Fixed footers cap height at 50%, scroll internally when needed and include bottom safe-area padding.

`.page-footer.footer-bordered` opts into a visible outline with 12px corners. Use `crazy-button` for expressive footer CTAs, such as `type="extended" variant="filled" size="normal"`; no extra height hacks are needed inside `.footer-copyright`.

## Existing components with updated styling

- `.collection-item.avatar` now centers its circle and trailing action vertically. Keep existing markup; do not introduce an avatar alignment class or page-only absolute offsets.
- Collapsible arrows animate through 180 degrees with nested-component scoping and reduced-motion support; use the existing component rather than duplicate rotation handlers.
- Breadcrumbs support icon alignment, current-page treatment and horizontal scrolling in their navbar wrapper. Use `aria-current="page"` for the current link and an accessible navigation label. Keep overflow handling on the breadcrumb container, not the whole page.
- Native `input[type="checkbox"]` uses the Materialize checkbox and focus/state layers. A `<label><input type="checkbox"><span>Label</span></label>` gets the standard text gap. Do not implement a faux checkbox using a toggle button/check-mark string.

Implementation locations: `components/appbar/`, `components/card/_cards.scss`, `components/timeline/_timeline.scss`, `components/footer/_footer.scss`, `components/list/_collection.scss`, `components/collapsible/_collapsible.scss`, `components/breadcrumb/_breadcrumb.scss`, and `components/checkbox/_checkboxes.scss`.
