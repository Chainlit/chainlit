import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseOverrideSelector,
  parsePackageKey,
  validateLockfile
} from './check-pnpm-overrides.mjs';

test('parseOverrideSelector extracts package name and selector range', () => {
  assert.deepEqual(parseOverrideSelector('ws@>=8.17.1 <8.21.0'), {
    packageName: 'ws',
    sourceRange: '>=8.17.1 <8.21.0'
  });

  assert.deepEqual(parseOverrideSelector('@babel/core@<7.29.6'), {
    packageName: '@babel/core',
    sourceRange: '<7.29.6'
  });
});

test('parsePackageKey extracts package name and resolved version', () => {
  assert.deepEqual(parsePackageKey('@babel/core@7.29.0'), {
    packageName: '@babel/core',
    version: '7.29.0'
  });

  assert.deepEqual(
    parsePackageKey(
      'vite-plugin-svgr@4.2.0(rollup@4.31.0)(typescript@5.2.2)(vite@5.4.14(@types/node@20.5.7))'
    ),
    {
      packageName: 'vite-plugin-svgr',
      version: '4.2.0'
    }
  );
});

test('validateLockfile reports non-applied overrides', () => {
  const lockfile = `
lockfileVersion: '9.0'

overrides:
  ws@>=8.17.1 <8.21.0: '>=8.21.0 <9.0.0'

packages:

  ws@8.18.0:
    resolution: {integrity: sha512-demo}
`;

  const errors = validateLockfile('frontend/pnpm-lock.yaml', lockfile);

  assert.deepEqual(errors, [
    'frontend/pnpm-lock.yaml: resolved ws@8.18.0 does not satisfy override "ws@>=8.17.1 <8.21.0" -> ">=8.21.0 <9.0.0"'
  ]);
});

test('validateLockfile passes when resolved versions satisfy override targets', () => {
  const lockfile = `
lockfileVersion: '9.0'

overrides:
  cross-spawn@>=7.0.0 <7.0.5: '>=7.0.5'

packages:

  cross-spawn@7.0.6:
    resolution: {integrity: sha512-demo}
`;

  assert.deepEqual(validateLockfile('pnpm-lock.yaml', lockfile), []);
});
