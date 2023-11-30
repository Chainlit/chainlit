import { runTestServer } from '../../support/testUtils';

describe('Scoped Elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display inlined, side and page elements', () => {
    cy.get('.step').should('have.length', 3);

    cy.get('.step').eq(0).find('.inline-image').should('have.length', 0);
    cy.get('.step').eq(0).find('.element-link').should('have.length', 0);
    cy.get('.step').eq(0).find('.inline-pdf').should('have.length', 0);

    cy.get('.step').eq(1).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(1).find('.element-link').should('have.length', 2);
    cy.get('.step').eq(1).find('.inline-pdf').should('have.length', 1);

    cy.get('.step').eq(2).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(2).find('.element-link').should('have.length', 2);
    cy.get('.step').eq(2).find('.inline-pdf').should('have.length', 1);
  });
});
