import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Chain of Thought', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display a nested CoT', () => {
    submitMessage('Hello');

    cy.get('#tool-1-loading').should('exist');
    cy.get('#tool-1-loading').click();

    cy.get('#tool-2-loading').should('exist');
    cy.get('#tool-2-loading').click();

    cy.get('#tool-1-done').should('exist');
    cy.get('#tool-2-done').should('exist');

    cy.get('.message').should('have.length', 5);
  });
});
