# kmaterialize Gantt, Popup steps and Editor

Use for scheduling, dialogs that mix async work and user interaction, and template/spreadsheet workspaces. See [kmaterialize.md](kmaterialize.md) for the verified checkout and release boundary. Source contracts live in `components/gantt/gantt.ts`, `components/popup/{popup,popup-stepper}.ts`, and `components/editor/{editor,spreadsheet-view}.ts`.

## Gantt scheduling

```html
<div id="schedule" class="gantt no-autoinit"></div>
```

```ts
import { Gantt } from 'kmaterialize';
const chart = Gantt.init(document.querySelector<HTMLElement>('#schedule')!, {
  label: 'Production schedule',
  editable: true,
  connectable: true,
  view: 'day',
  tasks: [
    { id: 'design', name: 'Design', start: '2026-10-01', end: '2026-10-05', progress: 115 },
    { id: 'build', name: 'Build', start: '2026-10-03', end: '2026-10-09', progress: 25, dependencies: ['design'] },
    { id: 'review', name: 'Review', start: '2026-10-10', end: '2026-10-10', milestone: true }
  ],
  onTaskChange: ({ task, previousTask, action }) => { /* persist the committed change */ },
  onDependencyChange: ({ from, to, action }) => { /* persist the added/removed link */ },
  onSelectionChange: ids => { /* update selection controls */ }
});
chart.setZoom(1.5);
chart.setSelectedTaskIds(['design', 'build']);
```

Tasks require unique nonempty IDs/names and valid `YYYY-MM-DD` dates; end dates are inclusive. Milestones occupy one date. Arithmetic uses UTC calendar days. Dependencies reference existing upstream IDs; self-links, duplicates and cycles are rejected. The total date span cannot exceed 3661 days.

**Dependency semantics matter:** links allow overlap and impose no finish-to-start ordering. Moving a task propagates the same day delta only to downstream tasks, transitively, once per affected task. Unstarted downstream tasks move both dates. A downstream task with `progress > 0` keeps its start: a later move extends its end, an earlier move leaves its end unchanged. Started milestones stay fixed, but propagation continues through them. The started-task rule also applies when a downstream task is selected with its predecessor. Resizing does not propagate dependencies; it affects the selected tasks, excluding milestones. Adding/removing a link does not reschedule anything.

- `editable` defaults to false; `connectable` defaults to true and displays controls only while editing. The plus connects by drag or click-then-choose; links can be removed from the curve or dependency caption. Escape cancels connecting/dragging.
- Native Materialize checkboxes toggle selection. Shift-click a checkbox or bar selects the inclusive anchored range in either direction; Ctrl/Cmd-click bars toggles individual tasks. Moving/resizing a selected task applies to the selection. Resizing preserves at least one calendar day.
- Arrow keys move by a day; Shift+arrow on a bar resizes its end. Focus an end handle to resize that end with arrows. Changes fire `onTaskChange` once per changed task after commit, including propagated tasks; an extension with fixed start reports `resize-end`.
- `onTaskClick(task, event)` is separate from selection. Callbacks and `getTasks()` provide copies. Persistence is the application's responsibility.

Methods: `getTasks()`, `setTasks(tasks)`, `getSelectedTaskIds()`, `setSelectedTaskIds(ids)`, `getView()` / `setView('day' | 'week')`, `getZoom()` / `setZoom(value)` / `resetZoom()`, `isEditable()` / `setEditable(boolean)`, `scrollToDate(date?)`, `addDependency(from, to)`, `removeDependency(from, to)`, `destroy()`. Programmatic task replacement validates data; do not assume it simulates a drag or cascades dates. Zoom defaults to 1 with bounds 0.5–3.

### Progress and overruns

`progress` is a finite nonnegative percentage and may exceed 100. Default colors are blue below 30%, green from 30% to below 90%, orange from 90% through 100%, and red above 100%. The visual fill stops at 100%; the text reports the overrun. These defaults describe time consumption, not an assumption that high completion is always good.

`progressColor` accepts any valid CSS color and overrides meter colors. `progressMeter: { low, high, optimum?, optimalColor?, suboptimalColor?, criticalColor? }` follows meter-like regions; thresholds stay within 0–100, `low <= high`, and `optimum` defaults to 100. Values above 100 always enter the critical region, unless the explicit color override wins. Theme all tasks with `--gantt-progress-low-color`, `--gantt-progress-optimal-color`, `--gantt-progress-suboptimal-color`, `--gantt-progress-critical-color`. `tone` (`primary/secondary/tertiary/error`) styles the task bar separately.

## Popup and async steps

Install `sweetalert2`; load its CSS before Materialize CSS. `Popup.fire(options)` preserves SweetAlert2 contracts and adds the framework theme; use `titleText`/`text` for plain text. `Popup.close()` and `Popup.clickConfirm()` are asynchronous helpers. A nested `Popup.fire()` replaces the current dialog: do not use one to gather input inside an active stepper.

`Popup.steps<T>({ title, description?, steps, cancellable?, cancelButtonText?, doneButtonText?, retryButtonText? })` executes a nonempty array of `{ title, description?, run(context) }` in order. Each `run` returns `T | Promise<T>` and receives:

| Context | Contract |
|---|---|
| `signal` | Aborted when the popup closes or is replaced; pass to fetch/work. |
| `results` | Read-only snapshot of completed values in step order. |
| `setMessage(text)` | Update this active step's plain-text message. |
| `waitForConfirmation<R>(options)` | **Local addition after 2.3.3-1.0.33:** pause for custom content and validation. Verify installed declarations before use. |

A thrown step error exposes Retry step; retry keeps completed values and reruns only the failed step. Cancellation signals work to abort and stops subsequent steps; it does not roll back completed side effects. Even `cancellable: false` permits closing after a failure. After all steps complete, Done confirms with `result.value: T[]`.

### Interactive step 2 and custom result in step 4

This example requires the local interactive-stepper addition. The wait options are `PopupStepConfirmationOptions<R>`: `content: HTMLElement`, optional `confirmButtonText`, and required `readValue(): R | Promise<R>`. Throw an Error from `readValue` to show validation without advancing. Await each wait before requesting another; duplicate confirmation is guarded. Cancellation rejects the wait with `AbortError`. Earlier custom content is removed on completion; final content stays until Done/Close.

```ts
import { Popup } from 'kmaterialize';

const result = await Popup.steps<string>({
  title: 'Prepare a review',
  doneButtonText: 'Close',
  steps: [
    { title: 'Check assets', run: async ({ signal }) => {
      signal.throwIfAborted();
      return 'Assets checked'; // Replace with abort-aware application work.
    } },
    { title: 'Choose a title', run: ({ waitForConfirmation }) => {
      const content = document.createElement('div');
      content.innerHTML = `<div class="input-field outlined">
        <input id="review-title" type="text" placeholder=" " required>
        <label for="review-title">Review title</label>
      </div>`;
      const input = content.querySelector<HTMLInputElement>('input')!;
      return waitForConfirmation({
        content,
        confirmButtonText: 'Continue',
        readValue: () => {
          const title = input.value.trim();
          input.setAttribute('aria-invalid', String(!title));
          if (!title) throw new Error('Enter a title.');
          return title;
        }
      });
    } },
    { title: 'Prepare preview', run: async ({ results, signal }) => {
      signal.throwIfAborted();
      return `Preview prepared for ${results[1]}`;
    } },
    { title: 'Review result', run: ({ results, waitForConfirmation }) => {
      const content = document.createElement('div');
      content.className = 'card-panel surface-variant';
      content.textContent = results[2]; // User input remains text, not HTML.
      return waitForConfirmation({
        content,
        confirmButtonText: 'Confirm preview',
        readValue: () => `Approved: ${results[1]}`
      });
    } }
  ]
});
if (result.isConfirmed) console.log(result.value);
```

Keep static trusted markup separate from user values; use `textContent` for custom results. Step labels and validation errors are rendered as text. Prefer the framework API to application code that reaches into SweetAlert2 internals.

## Popup tabs and fill-height layouts

`.tabs-fill` requires an allocated height and contains `.tabs` plus `.tabs-fill-panel` elements. `data-tab-position="bottom"` positions the tab navigation below the panels even if it appears first in the DOM; place it last when that also matches the desired reading/focus order.

Inside a popup use `customClass: { htmlContainer: 'popup-content-fill' }`, then initialize `Tabs` in `didOpen` and destroy it in `didDestroy`. This removes nested padding/borders. For fullscreen, use `grow: 'fullscreen'`, `showCloseButton: true`, `showConfirmButton: false`, and let the tabs use the available height instead of a fixed pixel height. Keep panel IDs unique. `.editor-fill` lets an editor occupy a panel's allocated height.

## Editor workspaces

`Editor` requires explicit initialization on one host and is outside AutoInit. Install `handlebars`, `prismjs` and `tom-select`; spreadsheet mode also needs `kspreadsheet` and its CSS. Framework styling includes the editor and spreadsheet theme. Await `editor.ready` before reading/generated results or exporting; dispose with `destroy()`.

```ts
import { Editor } from 'kmaterialize';
const editor = Editor.init(document.querySelector<HTMLElement>('#editor')!, {
  template: '<h1>{{project.name}}</h1>',
  data: { project: { name: 'Example' } },
  onRender: html => { /* consume rendered output */ }
});
await editor.ready;
editor.insertToken(['project', 'name']);
const html = await editor.render();
```

The default `variant: 'handlebars'` combines editable source, Prism highlighting, a searchable token tree, helper insertion, undo/redo and sandboxed HTML preview. Options include `readOnly`, `highlight`, `debounce`, per-editor `helpers`, or an `engine` implementing compile. The iframe blocks scripts, forms and remote resources; inline CSS and data/blob images are allowed. `getHtml()`/`render()` return generated HTML, not a sanitized document for arbitrary insertion elsewhere.

- `templates: [{ id, label, template? }]`, `templateId`, `sources: [{ id, label, data? }]`, `sourceId` configure selectors. IDs must be unique.
- `loadTemplates(query, signal)` / `loadSources(query, signal)` search remotely. `loadTemplate(id, signal)` / `loadData(id, signal)` retrieve uncached content. Use the provided AbortSignal; avoid stale responses replacing a newer selection.
- `templateSelect` / `sourceSelect` accept supported Tom Select settings; `false` hides the selector. Do not independently initialize generated selects.
- Methods: `getTemplate()`, `setTemplate(text)`, `getHtml()`, `setData(data)`, `getSource()`, `setSource(id)`, `getTemplateId()`, `selectTemplate(id)`, `setHelpers(helpers)`, `insertToken(path)`, `insertHelper(name)`, `undo()`, `redo()`, `render()`, `destroy()`.
- `--editor-height` changes the default workspace height. `.editor.editor-fill` fits a parent with a defined/allocated height; panes scroll internally and stack on mobile.

For `variant: 'spreadsheet'`, supply row data and `columns: [{ header, value, type?, width? }]`; `value` is a Handlebars template evaluated for each row. Types are `text`, `numeric`, `checkbox`; widths must be at least 40. Named templates may supply `columns`; lazy template loading may return a column array. The mapping view uses the same tokens, helpers and history. Methods: `getColumns()`, `setColumns(columns)`, `getSpreadsheetData()` → `{ headers, rows }`, `getWorksheet()`, and `await download('csv' | 'xlsx', filename?)`. Exports use kspreadsheet, not hand-built CSV/XLSX serialization.
