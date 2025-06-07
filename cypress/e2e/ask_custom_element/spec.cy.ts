import { runTestServer } from '../../support/testUtils';

describe('Ask Custom Element', () => {
  before(() => {
    runTestServer();
  });

  it('should send element props to the backend', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('#ticket-summary').type('Bug fix');
    cy.get('#ticket-description').type('Detailed description');
    cy.get('#ticket-submit').click();
    cy.get('.step').should('have.length', 3);
    cy.get('.step').eq(2).should('contain', 'Bug fix');
  });
});
