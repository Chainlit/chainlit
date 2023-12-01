import {
  describeSyncAsync,
  runTestServer,
  submitMessage
} from '../../support/testUtils';

describeSyncAsync('Step', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to nest steps', () => {
    submitMessage('Hello');

    cy.get('#tool-1-loading').should('exist');
    cy.get('#tool-1-loading').click();

    cy.get('#tool_2-loading').should('exist');
    cy.get('#tool_2-loading').click();

    cy.get('#tool-3-loading').should('exist');
    cy.get('#tool-3-loading').click();

    cy.get('#tool-1-done').should('exist');
    cy.get('#tool_2-done').should('exist');
    cy.get('#tool-3-done').should('exist');

    cy.get('.step').should('have.length', 5);
  });
});
