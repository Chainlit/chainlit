import { runTestServer } from '../../support/testUtils';

describe('remove_elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to remove elements', () => {
    cy.get('#step-tool1').should('exist');
    cy.get('#step-tool1').click();
    cy.get('#step-tool1')
      .parent()
      .parent()
      .find('.inline-image')
      .should('have.length', 1);

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).find('.inline-image').should('have.length', 1);
  });
});
