import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectRetriedTests } from './retryReport.ts';

const asTests = (tests: unknown) =>
  tests as CypressCommandLine.RunResult['tests'];

test('ignores a test that passed on its first attempt', () => {
  const tests = asTests([
    {
      title: ['suite', 'stable test'],
      state: 'passed',
      attempts: [{ state: 'passed' }]
    }
  ]);

  assert.deepEqual(
    collectRetriedTests('cypress/e2e/example/spec.cy.ts', tests),
    []
  );
});

test('reports a test that failed then passed as retried', () => {
  const tests = asTests([
    {
      title: ['suite', 'flaky test'],
      state: 'passed',
      attempts: [{ state: 'failed' }, { state: 'passed' }]
    }
  ]);

  assert.deepEqual(
    collectRetriedTests('cypress/e2e/example/spec.cy.ts', tests),
    [
      {
        spec: 'cypress/e2e/example/spec.cy.ts',
        title: 'suite > flaky test',
        attempts: 2
      }
    ]
  );
});

test('excludes a test that failed every attempt', () => {
  const tests = asTests([
    {
      title: ['suite', 'broken test'],
      state: 'failed',
      attempts: [
        { state: 'failed' },
        { state: 'failed' },
        { state: 'failed' },
        { state: 'failed' }
      ]
    }
  ]);

  assert.deepEqual(
    collectRetriedTests('cypress/e2e/example/spec.cy.ts', tests),
    []
  );
});
