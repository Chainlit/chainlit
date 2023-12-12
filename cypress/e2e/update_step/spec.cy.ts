import { runTestServer } from '../../support/testUtils';

describe('Update Step', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to update a step', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('#chatbot-loading').should('exist').click();
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).should('contain', 'Hello!');
    cy.get('.step').eq(1).should('contain', 'Foo');

    cy.get('.step').eq(0).should('contain', 'Hello again!');
    cy.get('.step').eq(1).should('contain', 'Foo Bar');
  });
});
