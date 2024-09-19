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
    submitMessage('Hello');
    cy.get('#stop-button').should('exist').click();
    cy.get('#stop-button').should('not.exist');

    cy.get('.step').should('have.length', 3);
    cy.get('.step').last().should('contain.text', 'Task manually stopped.');
  });
});
