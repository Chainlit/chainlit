import { runTestServer } from '../../support/testUtils';

describe('remove_elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to remove elements', () => {
    cy.get('#tool-call-tool1').should('exist');
    cy.get('#tool-call-tool1').click();
    cy.get('#tool-call-tool1')
      .parent()
      .find('.inline-image')
      .should('have.length', 1);

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).find('.inline-image').should('have.length', 1);
  });
});
