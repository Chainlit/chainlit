import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Default Expand', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to set the default_expand_messages field in the config to have the CoT expanded by default', () => {
    submitMessage('Hello');

    cy.get(".message:contains('Hello')").contains('I need to use tool 2');
    cy.get(".message:contains('I need to use tool 2')").contains(
      'Response from tool 2'
    );
    cy.get(".message:contains('Hello')").contains('Response from tool 3');
  });
});
