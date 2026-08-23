#!/usr/bin/env node

/**
 * Fail when a pnpm.overrides entry is declared but not applied in the lockfile.
 *
 * `pnpm install --frozen-lockfile` only checks that the lockfile agrees with the
 * manifest. It does not check that resolved versions satisfy override targets, so
 * a security pin can land while the vulnerable version is still installed (#3000).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const WORKSPACE_PACKAGES = [
  '.',
  'frontend',
  'libs/copilot',
  'libs/react-client'
];

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseVersion(input) {
  const text = String(input).trim();
  if (!text) {
    return null;
  }
  const plus = text.indexOf('+');
  const noBuild = plus === -1 ? text : text.slice(0, plus);
  const dash = noBuild.indexOf('-');
  const core = dash === -1 ? noBuild : noBuild.slice(0, dash);
  const pre = dash === -1 ? '' : noBuild.slice(dash + 1);
  const bits = core.split('.');
  if (bits.length === 0 || bits.length > 3) {
    return null;
  }
  const major = Number(bits[0]);
  const minor = Number(bits[1] ?? 0);
  const patch = Number(bits[2] ?? 0);
  if (![major, minor, patch].every((n) => Number.isInteger(n) && n >= 0)) {
    return null;
  }
  const prerelease = pre
    ? pre.split('.').map((part) => (/^\d+$/.test(part) ? Number(part) : part))
    : [];
  return { major, minor, patch, prerelease };
}

function compareVersions(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  if (a.patch !== b.patch) {
    return a.patch - b.patch;
  }
  if (!a.prerelease.length && !b.prerelease.length) {
    return 0;
  }
  if (!a.prerelease.length) {
    return 1;
  }
  if (!b.prerelease.length) {
    return -1;
  }
  const n = Math.max(a.prerelease.length, b.prerelease.length);
  for (let i = 0; i < n; i += 1) {
    if (i >= a.prerelease.length) {
      return -1;
    }
    if (i >= b.prerelease.length) {
      return 1;
    }
    const x = a.prerelease[i];
    const y = b.prerelease[i];
    if (x === y) {
      continue;
    }
    const xNum = typeof x === 'number';
    const yNum = typeof y === 'number';
    if (xNum && yNum) {
      return x - y;
    }
    if (xNum) {
      return -1;
    }
    if (yNum) {
      return 1;
    }
    return x < y ? -1 : 1;
  }
  return 0;
}

function parseAndComparators(andRange) {
  const range = andRange.trim();
  if (!range || range === '*' || range === 'x' || range === 'X') {
    return [{ op: '*' }];
  }
  const parts = range.split(/\s+(?=[<>]=?)/);
  return parts.map((part) => {
    const trimmed = part.trim();
    const match = trimmed.match(/^(<=|>=|<|>|=)(.+)$/);
    if (match) {
      return { op: match[1], version: parseVersion(match[2].trim()) };
    }
    return { op: '=', version: parseVersion(trimmed) };
  });
}

function compareOp(version, op, bound) {
  if (op === '*') {
    return true;
  }
  if (!bound) {
    return false;
  }
  const cmp = compareVersions(version, bound);
  switch (op) {
    case '=':
      return cmp === 0;
    case '>':
      return cmp > 0;
    case '>=':
      return cmp >= 0;
    case '<':
      return cmp < 0;
    case '<=':
      return cmp <= 0;
    default:
      return false;
  }
}

function satisfies(versionStr, rangeStr) {
  const version = parseVersion(versionStr);
  if (!version) {
    return false;
  }
  const orSets = String(rangeStr)
    .split('||')
    .map((part) => part.trim())
    .filter(Boolean);
  if (!orSets.length) {
    return false;
  }
  return orSets.some((andRange) => {
    const comparators = parseAndComparators(andRange);
    if (
      !comparators.length ||
      comparators.some((c) => c.op !== '*' && !c.version)
    ) {
      return false;
    }
    if (version.prerelease.length) {
      const allowed = comparators.some(
        (c) =>
          c.version &&
          c.version.prerelease.length &&
          c.version.major === version.major &&
          c.version.minor === version.minor &&
          c.version.patch === version.patch
      );
      if (!allowed) {
        return false;
      }
    }
    return comparators.every((c) => compareOp(version, c.op, c.version));
  });
}

function lastParentSeparator(selector) {
  let last = -1;
  for (let i = 0; i < selector.length; i += 1) {
    if (selector[i] !== '>' || selector[i + 1] === '=') {
      continue;
    }
    // `foo@>1.0.0` is a version comparator, not a parent selector.
    if (i > 0 && selector[i - 1] === '@') {
      continue;
    }
    const next = selector[i + 1] ?? '';
    // pnpm parent selectors: `foo>bar`, `foo@1>bar`, `foo>@scope/pkg`, `foo>123`.
    if (next === '@' || /[A-Za-z0-9]/.test(next)) {
      last = i;
    }
  }
  return last;
}

function parseSelector(selector) {
  const trimmed = selector.trim();
  const gt = lastParentSeparator(trimmed);
  if (gt !== -1) {
    return { name: null, range: '*', parentScoped: true };
  }
  const pkg = trimmed;
  if (pkg.startsWith('@')) {
    const at = pkg.indexOf('@', 1);
    if (at === -1) {
      return { name: pkg, range: '*' };
    }
    return { name: pkg.slice(0, at), range: pkg.slice(at + 1) || '*' };
  }
  const at = pkg.indexOf('@');
  if (at === -1) {
    return { name: pkg, range: '*' };
  }
  return { name: pkg.slice(0, at), range: pkg.slice(at + 1) || '*' };
}

function parsePackageKey(key) {
  const bare = key.replace(/\(.*\)$/, '');
  return parseSelector(bare);
}

function parseLockfile(content) {
  const overrides = {};
  const versionsByName = new Map();
  let section = null;

  for (const line of content.split('\n')) {
    if (!line.startsWith(' ') && line.endsWith(':')) {
      section = line.slice(0, -1);
      continue;
    }
    if (section === 'overrides') {
      const match = line.match(/^ {2}(.+?):\s*(.*)$/);
      if (match) {
        overrides[unquote(match[1])] = unquote(match[2]);
      }
      continue;
    }
    if (section === 'packages' && /^ {2}\S/.test(line) && line.endsWith(':')) {
      const key = unquote(line.slice(2, -1));
      const parsed = parsePackageKey(key);
      if (!parsed.name || !parseVersion(parsed.range)) {
        continue;
      }
      if (!versionsByName.has(parsed.name)) {
        versionsByName.set(parsed.name, new Set());
      }
      versionsByName.get(parsed.name).add(parsed.range);
    }
  }

  return { overrides, versionsByName };
}

function assertRangeParseable(range, label) {
  const comparators = String(range)
    .split('||')
    .flatMap((part) => parseAndComparators(part.trim()));
  if (
    !comparators.length ||
    comparators.some((c) => c.op !== '*' && !c.version)
  ) {
    throw new Error(
      `Cannot parse ${label}: ${range}. Only *, x, and simple comparators (>, >=, <, <=, =, and space-AND / ||-OR lists) are supported.`
    );
  }
}

function checkOverride(lockfilePath, selector, target, versionsByName) {
  const parsed = parseSelector(selector);
  if (parsed.parentScoped) {
    return [
      `${lockfilePath}: parent-scoped override "${selector}" is not supported; use a package selector such as "ws@>=8.0.0"`
    ];
  }
  const { name, range: selectorRange } = parsed;
  assertRangeParseable(target, `target of ${selector}`);
  if (selectorRange && selectorRange !== '*') {
    assertRangeParseable(selectorRange, `selector ${selector}`);
  }

  const versions = [...(versionsByName.get(name) ?? [])].sort();
  const problems = [];
  const unscoped = !selectorRange || selectorRange === '*';

  for (const version of versions) {
    const inSelector = unscoped ? true : satisfies(version, selectorRange);
    const inTarget = satisfies(version, target);

    if (inSelector && unscoped === false) {
      problems.push(
        `${lockfilePath}: ${name}@${version} is still in the selector range of "${selector}" (override did not apply)`
      );
    }
    if (inSelector && !inTarget) {
      problems.push(
        `${lockfilePath}: ${name}@${version} does not satisfy override target "${target}" from "${selector}"`
      );
    }
  }

  return problems;
}

function rel(path) {
  return relative(ROOT, path) || '.';
}

function checkPackage(dir) {
  const packageJsonPath = join(ROOT, dir, 'package.json');
  const lockfilePath = join(ROOT, dir, 'pnpm-lock.yaml');
  const pkgRel = rel(packageJsonPath);
  const lockRel = rel(lockfilePath);

  let pkg;
  try {
    pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  } catch (err) {
    return [`${pkgRel}: cannot read package.json (${err.message})`];
  }

  const declared = pkg.pnpm?.overrides;
  if (!declared || !Object.keys(declared).length) {
    return [];
  }

  let lockfile;
  try {
    lockfile = parseLockfile(readFileSync(lockfilePath, 'utf8'));
  } catch (err) {
    return [`${lockRel}: cannot read lockfile (${err.message})`];
  }

  const problems = [];
  for (const [selector, target] of Object.entries(declared)) {
    if (typeof target !== 'string') {
      problems.push(
        `${pkgRel}: override "${selector}" target must be a string`
      );
      continue;
    }
    if (lockfile.overrides[selector] !== target) {
      problems.push(
        `${pkgRel}: override "${selector}" -> "${target}" is not recorded in ${lockRel}`
      );
    }
    problems.push(
      ...checkOverride(lockRel, selector, target, lockfile.versionsByName)
    );
  }
  return problems;
}

function selfTest() {
  assert.equal(satisfies('8.18.0', '>=8.17.1 <8.21.0'), true);
  assert.equal(satisfies('8.18.0', '>=8.21.0 <9.0.0'), false);
  assert.equal(satisfies('8.18.0', '>=8.0.0 <8.17.1'), false);
  assert.equal(satisfies('8.18.0', '>=8.17.1'), true);
  assert.equal(satisfies('4.24.0', '>=3.0.0 <3.29.5'), false);
  assert.equal(satisfies('4.24.0', '>=3.29.5'), true);
  assert.equal(satisfies('7.29.0', '>=7.29.6 <8.0.0'), false);
  assert.equal(satisfies('0.16.22', '>=0.16.10'), true);
  assert.equal(satisfies('0.16.9', '>=0.10.0-beta <0.16.10'), true);
  assert.equal(satisfies('4.5.1', '>=4.0.0 <=4.5.1'), true);
  assert.equal(satisfies('4.5.2', '>=4.0.0 <=4.5.1'), false);
  assert.equal(satisfies('3.0.2', '<3.0.3'), true);
  assert.equal(satisfies('4.3.3', '<4.3.2'), false);
  assert.deepEqual(parseSelector('ws@>=8.17.1 <8.21.0'), {
    name: 'ws',
    range: '>=8.17.1 <8.21.0'
  });
  assert.deepEqual(parseSelector('ws@>1.0.0'), {
    name: 'ws',
    range: '>1.0.0'
  });
  assert.deepEqual(parseSelector('foo>bar'), {
    name: null,
    range: '*',
    parentScoped: true
  });
  assert.deepEqual(parseSelector('foo>123'), {
    name: null,
    range: '*',
    parentScoped: true
  });

  const leftover = checkOverride(
    'frontend/pnpm-lock.yaml',
    'ws@>=8.17.1 <8.21.0',
    '>=8.21.0 <9.0.0',
    new Map([['ws', new Set(['8.18.0'])]])
  );
  assert.ok(leftover.length > 0, 'unapplied ws pin must fail');

  const applied = checkOverride(
    'frontend/pnpm-lock.yaml',
    'ws@>=8.0.0 <8.17.1',
    '>=8.17.1',
    new Map([['ws', new Set(['8.18.0'])]])
  );
  assert.equal(applied.length, 0, 'applied unbounded ws pin should pass');

  const disjoint = checkOverride(
    'frontend/pnpm-lock.yaml',
    'ws@>=8.17.1 <8.21.0',
    '>=8.21.0 <9.0.0',
    new Map([['ws', new Set(['8.11.0'])]])
  );
  assert.equal(
    disjoint.length,
    0,
    'versions outside a version-scoped selector must not be required to match the target'
  );

  const parent = checkOverride(
    'frontend/pnpm-lock.yaml',
    'engine.io-client>ws',
    '>=8.21.0',
    new Map([['ws', new Set(['8.18.0'])]])
  );
  assert.ok(
    parent.some((msg) => msg.includes('parent-scoped')),
    'parent-scoped overrides must be rejected instead of treated as package-wide'
  );

  assert.throws(
    () => assertRangeParseable('^1.2.3', 'target'),
    /simple comparators/
  );
}

function main() {
  selfTest();

  const problems = WORKSPACE_PACKAGES.flatMap(checkPackage);
  if (problems.length) {
    console.error(
      'pnpm.overrides are declared but not applied in the lockfile:\n'
    );
    for (const problem of problems) {
      console.error(`  ${problem}`);
    }
    console.error(
      '\nRe-lock after fixing selectors/targets, or drop overrides that cannot match the graph.'
    );
    process.exit(1);
  }

  console.log(
    `Checked pnpm.overrides in ${WORKSPACE_PACKAGES.join(', ')}: resolved versions match override targets.`
  );
}

main();
