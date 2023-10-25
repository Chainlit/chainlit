import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Chain of Thought', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display a nested CoT', () => {
    submitMessage('Hello');

    cy.get(".message:contains('Hello')").contains('Response from tool 1');
    cy.get(".message:contains('Response from tool 1')").contains(
      'Response from tool 2'
    );
    cy.get(".message:contains('Response from tool 2')").contains(
      'Response from tool 3'
    );
  });
});
