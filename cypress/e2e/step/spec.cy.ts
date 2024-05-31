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

    cy.get('#tool-call-tool1').should('exist').click();

    cy.get('#tool-call-tool2').should('exist').click();

    cy.get('#tool-call-tool3').should('exist').click();

    cy.get('.step').should('have.length', 2);
  });
});
