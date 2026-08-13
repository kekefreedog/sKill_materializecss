#!/usr/bin/env node
/**
 * verify-classes.mjs — check that every CSS class used in Materialize markup
 * actually exists in Materialize v2.3.3.
 *
 * The failure mode this guards against: plausible-looking class names that were
 * carried over from v1 docs or invented outright. They produce no error, the
 * element just renders unstyled.
 *
 * Usage:
 *   node verify-classes.mjs [paths...] [--css <materialize.css>] [--all]
 *
 *   paths      files or directories to scan (.md, .html). Default: the skill's
 *              own references/ plus SKILL.md
 *   --css      path to materialize.css. Auto-detected if omitted.
 *   --all      also scan v1-migration.md, which intentionally contains v1 markup
 *
 * Exit code 0 = clean, 1 = unknown classes found or stylesheet not located.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL_ROOT = resolve(HERE, '..');

/**
 * Classes that are hooks for JavaScript or attribute selectors and therefore
 * legitimately absent from the compiled stylesheet. Verified against the v2
 * source: AutoInit's selector registry, Waves.Init, Forms.validateField.
 */
const JS_ONLY = new Set([
  'autocomplete',
  'cards',
  'datepicker',
  'modal-trigger',
  'no-autoinit',
  'scrollspy',
  'sidenav-trigger',
  'timepicker',
  'tooltipped',
  'validate',
  'waves-circle',
  'waves-effect',
  'waves-light'
]);

/**
 * v1 classes that must be reported even though a matching selector survives in
 * the v2 stylesheet. `.col` is the important one: it appears exactly once, in
 * the dead rule `.input-field.col .dropdown-content [type=checkbox] + label`,
 * so a naive lookup treats it as valid — but it carries no layout behaviour in
 * v2's CSS Grid, which is the single most common porting mistake.
 */
const FORBIDDEN = new Map([
  ['col', 'v1 float grid; in v2 span classes go directly on the .row child'],
  ['helper-text', 'renamed to supporting-text'],
  ['card-tabs', 'removed; put .tabs inside .card-content']
]);

/** v1 classes matched by shape rather than exact name. */
const FORBIDDEN_PATTERNS = [
  [/^push-(s|m|l|xl)\d+$/, 'push-* is never emitted in v2; use offset-*'],
  [/^pull-(s|m|l|xl)\d+$/, 'pull-* is never emitted in v2; use offset-*'],
  [/^waves-(?!effect$|light$|circle$)[a-z]+$/, 'only waves-light and waves-circle are read']
];

function forbiddenReason(cls) {
  if (FORBIDDEN.has(cls)) return FORBIDDEN.get(cls);
  for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
    if (pattern.test(cls)) return reason;
  }
  return null;
}

/** Candidate locations for the compiled stylesheet, tried in order. */
const CSS_CANDIDATES = [
  'node_modules/@materializecss/materialize/dist/css/materialize.css',
  '../node_modules/@materializecss/materialize/dist/css/materialize.css',
  '../src/materialize-main/dist/css/materialize.css',
  '../../src/materialize-main/dist/css/materialize.css'
];

const COLORS_SUFFIXES = ['materialize.colors.css', 'materialize.colors.min.css'];

function parseArgs(argv) {
  const paths = [];
  let css = null;
  let all = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--css') css = argv[++i];
    else if (arg === '--all') all = true;
    else if (arg.startsWith('--')) throw new Error(`Unknown flag: ${arg}`);
    else paths.push(arg);
  }
  return { paths, css, all };
}

function findStylesheet(explicit) {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`Stylesheet not found: ${explicit}`);
    return resolve(explicit);
  }
  for (const rel of CSS_CANDIDATES) {
    const candidate = resolve(SKILL_ROOT, rel);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Every class selector defined in a stylesheet. */
function classesFrom(cssPath) {
  const css = readFileSync(cssPath, 'utf8');
  const found = new Set();
  for (const match of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) found.add(match[1]);
  return found;
}

function collectFiles(target) {
  const stats = statSync(target);
  if (stats.isFile()) return [target];

  const out = [];
  for (const entry of readdirSync(target)) {
    const full = join(target, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else if (['.md', '.html'].includes(extname(entry))) out.push(full);
  }
  return out;
}

/**
 * Markup regions of a file, as {content, line} chunks.
 * For markdown, only fenced html/htm blocks count — prose and TypeScript
 * examples would otherwise produce noise. Blocks containing a `<!-- v1 -->`
 * marker are skipped: they document the old API on purpose.
 */
function markupChunks(file) {
  const text = readFileSync(file, 'utf8');

  if (extname(file) !== '.md') return [{ content: text, line: 1 }];

  const chunks = [];
  const lines = text.split('\n');
  let inBlock = false;
  let buffer = [];
  let startLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = line.match(/^\s*```(\w*)/);

    if (fence && !inBlock) {
      if (['html', 'htm'].includes(fence[1].toLowerCase())) {
        inBlock = true;
        buffer = [];
        startLine = i + 2;
      }
      continue;
    }
    if (fence && inBlock) {
      const content = buffer.join('\n');
      if (!/<!--\s*v1\s*-->/i.test(content)) chunks.push({ content, line: startLine });
      inBlock = false;
      continue;
    }
    if (inBlock) buffer.push(line);
  }
  return chunks;
}

/** Class tokens used in a markup chunk, with the line each appears on. */
function usedClasses(chunk) {
  const uses = new Map();

  for (const attr of chunk.content.matchAll(/class(?:Name)?\s*=\s*["']([^"']+)["']/g)) {
    const offset = chunk.content.slice(0, attr.index).split('\n').length - 1;
    for (const token of attr[1].split(/\s+/)) {
      // skip template interpolation such as {theme} or ${cls}
      if (!token || token.includes('{') || token.includes('$')) continue;
      if (!uses.has(token)) uses.set(token, chunk.line + offset);
    }
  }
  return uses;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const cssPath = findStylesheet(args.css);
  if (!cssPath) {
    console.error('Could not locate materialize.css.');
    console.error('Pass it explicitly:  node verify-classes.mjs --css <path/to/materialize.css>');
    console.error('Tried:');
    for (const rel of CSS_CANDIDATES) console.error(`  ${resolve(SKILL_ROOT, rel)}`);
    process.exit(1);
  }

  const known = classesFrom(cssPath);

  // The legacy palette ships as a separate stylesheet; fold it in when present.
  let colorsPath = null;
  for (const name of COLORS_SUFFIXES) {
    const candidate = join(dirname(cssPath), name);
    if (existsSync(candidate)) {
      colorsPath = candidate;
      for (const cls of classesFrom(candidate)) known.add(cls);
      break;
    }
  }

  const targets = args.paths.length
    ? args.paths
    : [join(SKILL_ROOT, 'references'), join(SKILL_ROOT, 'SKILL.md')];

  const files = targets
    .flatMap((t) => collectFiles(resolve(t)))
    .filter((f) => args.all || basename(f) !== 'v1-migration.md');

  const problems = [];
  let checked = 0;

  for (const file of files) {
    for (const chunk of markupChunks(file)) {
      for (const [cls, line] of usedClasses(chunk)) {
        checked++;
        const reason = forbiddenReason(cls);
        if (reason) {
          problems.push({ file, line, cls, reason });
          continue;
        }
        if (known.has(cls) || JS_ONLY.has(cls)) continue;
        problems.push({ file, line, cls, reason: 'not defined in v2' });
      }
    }
  }

  console.log(`stylesheet   ${cssPath}`);
  if (colorsPath) console.log(`palette      ${colorsPath}`);
  console.log(`known        ${known.size} classes`);
  console.log(`scanned      ${files.length} files, ${checked} class usages\n`);

  if (problems.length === 0) {
    console.log('No invalid classes found.');
    return;
  }

  console.error(`Invalid classes (${problems.length}):\n`);
  for (const { file, line, cls, reason } of problems) {
    console.error(`  ${file}:${line}  .${cls} — ${reason}`);
  }
  console.error('\nEach of these fails silently at runtime. Check for v1 markup or a typo.');
  process.exit(1);
}

main();
