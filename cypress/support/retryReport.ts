export interface RetriedTest {
  spec: string;
  title: string;
  attempts: number;
}

/**
 * A test counts as retried when at least one attempt failed but the overall
 * test still passed - i.e. Cypress' `retries` config absorbed the failure.
 * Tests that exhaust every retry and still fail are already visible via the
 * job's exit status, so they are excluded here.
 */
export function collectRetriedTests(
  specRelative: string,
  tests: CypressCommandLine.RunResult['tests']
): RetriedTest[] {
  return tests
    .filter(
      (test) =>
        test.state === 'passed' &&
        test.attempts.some((attempt) => attempt.state === 'failed')
    )
    .map((test) => ({
      spec: specRelative,
      title: test.title.join(' > '),
      attempts: test.attempts.length
    }));
}
