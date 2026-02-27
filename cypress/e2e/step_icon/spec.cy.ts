import { submitMessage } from '../../support/testUtils';

describe('Step with Icon', () => {
  it('should display icons for steps with icon property', () => {
    submitMessage('Hello');

    cy.get('.step').should('have.length', 5);

    // Check that steps with icons have SVG icons (not avatar images)
    // The avatar is a sibling of the step content in the .ai-message container
    cy.get('#step-search')
      .closest('.ai-message')
      .within(() => {
        // Should have an svg icon (Lucide icons are SVGs)
        cy.get('svg').should('exist');
        // Should NOT have an avatar image
        cy.get('img').should('not.exist');
      });

    cy.get('#step-database')
      .closest('.ai-message')
      .within(() => {
        cy.get('svg').should('exist');
        cy.get('img').should('not.exist');
      });

    // Check that step without icon has avatar (image)
    cy.get('#step-regular')
      .closest('.ai-message')
      .within(() => {
        // Should have an avatar image
        cy.get('img').should('exist');
      });

    cy.get('#step-cpu')
      .closest('.ai-message')
      .within(() => {
        cy.get('svg').should('exist');
        cy.get('img').should('not.exist');
      });
  });
});
