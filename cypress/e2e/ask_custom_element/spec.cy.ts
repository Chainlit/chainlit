import { runTestServer } from '../../support/testUtils';

describe('Ask Custom Element', () => {
  before(() => {
    runTestServer();
  });

  it('should send element props to the backend', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('#ticket-submit').should('be.disabled');
    cy.get('#summary').type('Bug fix');
    cy.get('#description').type('Detailed description');
    cy.get('#ticket-submit').should('not.be.disabled').click();
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Bug fix');
  });
});
