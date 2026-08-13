# MaterializeCSS v2 — Claude Code Skill

A [Claude Code](https://claude.com/claude-code) skill for building UIs with **MaterializeCSS v2.3.3** (`@materializecss/materialize`) using TypeScript or vanilla JavaScript.

Most Materialize material online documents **v1.0.0** — the jQuery era. v2 changed the grid to CSS Grid, moved theming to Material Design 3 tokens, dropped jQuery entirely, and turned modals into native `<dialog>`. Crucially, v1 markup **fails silently** in v2: no console error, the element just renders unstyled or does nothing. This skill exists so an agent writes v2 that actually works.

## Install

```bash
git clone https://github.com/<you>/materializecss-skill.git ~/.claude/skills/materializecss
```

Or clone anywhere and symlink:

```bash
ln -s /path/to/materializecss-skill ~/.claude/skills/materializecss
```

The directory name must be `materializecss` to match the `name:` in the frontmatter.

## Contents

| File | Contents |
|---|---|
| `SKILL.md` | Setup, grid, theming, init API, component index, gotchas |
| `references/layout-theming.md` | Grid, breakpoints, MD3 tokens, dark mode, typography, spacing, helpers |
| `references/components.md` | Per-component markup, init, options and methods |
| `references/forms.md` | Form fields, inputs, select, pickers, chips, validation |
| `references/typescript.md` | Imports, types, instance handling, framework integration |
| `references/v1-migration.md` | v1 → v2 conversion tables and jQuery removal |
| `references/crazyphp-integration.md` | CrazyPHP SCSS layout and the `enhancement/` convention |
| `assets/materialize-v2-fixes.css` | Shim for confirmed upstream bugs in 2.3.3 |
| `scripts/verify-classes.mjs` | Flags CSS classes that don't exist in v2 |

## The traps it encodes

Every one of these looks correct and does nothing:

- **`.col` doesn't exist.** `.row` is CSS Grid; span classes go directly on the child.
- **`M.Modal` is a dead stub** — `open()` is `return this`. Use native `<dialog>` + `.showModal()`.
- **Pickers don't pop up without `displayPlugin: 'docked'`** — the calendar renders inline instead.
- **`<select>` must not be wrapped in `.input-field`** — `FormSelect` generates its own.
- **`placeholder=" "` is required** or the floating label sticks in the raised position.
- **`.right` is inert in a navbar** — `.nav-wrapper` is flex, so floats do nothing. Use `ml-auto`.
- Only `waves-light` and `waves-circle` are honoured; other `waves-*` variants are ignored.
- Legacy colour classes (`.red`, `.darken-2`) need a second stylesheet.

## Known upstream bugs

`assets/materialize-v2-fixes.css` patches three confirmed defects in stock 2.3.3:

1. **Checkbox labels sit flush against the box.** `_checkboxes.scss` opens a block comment at line 89 that is never closed, so the label-spacing rule never compiles — the stray `/*` even survives into `dist/css/materialize.css`.
2. **The chips input renders as a full-width bordered field.** `chips.css` misspells its selector as `.chis` instead of `.chips`, and the typo ships in `dist`.
3. **`displayPlugin: 'modal'` renders the picker below the page.** `ModalDisplayPlugin.show()` sets the `open` attribute instead of calling `dialog.showModal()`, so the dialog never enters the top layer and lands at its static position at the end of `<body>`. Prefer `displayPlugin: 'docked'`.

All three are reported with source line references in `references/forms.md`.

## Verifying

```bash
node scripts/verify-classes.mjs
```

Extracts class tokens from the reference markdown and checks each against `dist/css/materialize.css`, with an allowlist for JS-only hooks (`waves-effect`, `no-autoinit`, …) and an explicit deny-list for v1 leftovers such as `.col`. Point it at your own markup too:

```bash
node scripts/verify-classes.mjs src/**/*.html \
  --css node_modules/@materializecss/materialize/dist/css/materialize.css
```

Exit code is 1 when something invalid is found.

## Accuracy

Options, defaults and methods are taken from the v2.3.3 TypeScript source (each component's `_defaults`), not from v1 documentation. Class names are checked against the compiled stylesheet. Where v2 has a genuine bug or an undocumented requirement, it's cited with a file and line number.

Rendering was verified by hand against a demo page; the layout and cascade findings above came out of that pass rather than static checking. Corrections and additions welcome.

## Licence

MIT — see [LICENSE](LICENSE).

Documents [MaterializeCSS](https://github.com/materializecss/materialize), which is MIT licensed. This repository contains no Materialize source, only original documentation about it.
