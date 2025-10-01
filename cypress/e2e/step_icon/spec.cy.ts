import { submitMessage } from '../../support/testUtils';

describe('Step with Icon', () => {
  it('should be able to use steps with icons', () => {
    submitMessage('Hello');

    cy.get('#step-search').should('exist').click();

    cy.get('#step-database').should('exist').click();

    cy.get('#step-regular').should('exist').click();

    cy.get('#step-cpu').should('exist');

    cy.get('.step').should('have.length', 5);
  });
});
