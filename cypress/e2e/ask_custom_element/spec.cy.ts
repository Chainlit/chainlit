import { runTestServer } from '../../support/testUtils';

describe('Ask Custom Element', () => {
  before(() => {
    runTestServer();
  });

  it('should send element props to the backend', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('#ask-input').type('Hello');
    cy.get('#ask-submit').click();
    cy.get('.step').should('have.length', 3);
    cy.get('.step').eq(2).should('contain', 'Hello');
  });
});
