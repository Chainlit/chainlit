import {
  describeSyncAsync,
  runTestServer,
  submitMessage
} from '../../support/testUtils';

describeSyncAsync('Stop task', (mode) => {
  before(() => {
    runTestServer(mode);
  });

  it('should be able to stop a task', () => {
    cy.get('.step').should('have.length', 1);

    cy.get('.step').last().should('contain.text', 'Message 1');
    cy.get('#stop-button').should('exist').click();
    cy.get('#stop-button').should('not.exist');

    cy.get('.step').should('have.length', 2);

    cy.get('.step').last().should('contain.text', 'Task manually stopped.');

    cy.wait(5000);

    cy.get('.step').should('have.length', 2);

    submitMessage('Hello');

    cy.get('.step').should('have.length', 4);

    cy.get('.step').last().should('contain.text', 'World');
  });
});
