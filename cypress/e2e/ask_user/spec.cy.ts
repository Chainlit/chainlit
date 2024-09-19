import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Ask User', () => {
  before(() => {
    runTestServer();
  });

  it('should send a new message containing the user input', () => {
    cy.get('.step').should('have.length', 1);
    submitMessage('Jeeves');

    cy.get('.step').should('have.length', 3);

    cy.get('.step').eq(2).should('contain', 'Jeeves');
  });
});
