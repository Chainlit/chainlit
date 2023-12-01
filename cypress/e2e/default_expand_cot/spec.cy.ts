import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Default Expand', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to set the default_expand_messages field in the config to have the CoT expanded by default', () => {
    submitMessage('Hello');

    cy.get(".step:contains('Hello')").contains('Response from tool 1');
    cy.get(".step:contains('Response from tool 1')").contains(
      'Response from tool 2'
    );
    cy.get(".step:contains('Hello')").contains('Response from tool 3');
    cy.get(".step:contains('Final response')");
  });
});
