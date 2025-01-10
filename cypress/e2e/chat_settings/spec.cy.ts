import { runTestServer } from '../../support/testUtils';

describe('Customize chat settings', () => {
  before(() => {
    runTestServer();
  });

  it('should update inputs', () => {
    // Open chat settings modal
    cy.get('#chat-settings-open-modal').should('exist');
    cy.get('#chat-settings-open-modal').click();
    cy.get('#chat-settings').should('exist');

    // Update inputs
    cy.get('#Model').click();
    cy.contains('gpt-4').click();
    cy.get('#Model').should('contain.text', 'gpt-4');

    cy.get('#Temperature')
      .find('[role="slider"]')
      .focus()
      .type('{leftarrow}'.repeat(6))
      .should('have.attr', 'aria-valuenow', '0.4');

    cy.get('#SAI_Steps')
      .find('[role="slider"]')
      .focus()
      .type('{rightarrow}'.repeat(6))
      .should('have.attr', 'aria-valuenow', '36');

      cy.get('#SAI_Cfg_Scale')
      .find('[role="slider"]')
      .focus()
      .type('{rightarrow}'.repeat(6))
      .should('have.attr', 'aria-valuenow', '7.6');

    cy.contains('Confirm').click();

    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Settings updated!');

    // Check if inputs are updated
    cy.get('#chat-settings-open-modal').click();
    cy.get('#Temperature').find('[role="slider"]')
    .should('have.attr', 'aria-valuenow', '0.4');

    cy.get('#SAI_Steps').find('[role="slider"]')
    .should('have.attr', 'aria-valuenow', '36');

    cy.get('#SAI_Cfg_Scale').find('[role="slider"]')
    .should('have.attr', 'aria-valuenow', '7.6');

    cy.get('#SAI_Width').find('[role="slider"]')
    .should('have.attr', 'aria-valuenow', '512');

    cy.get('#SAI_Height').find('[role="slider"]')
    .should('have.attr', 'aria-valuenow', '512');

    // Check if modal is correctly closed
    cy.contains('Cancel').click();
    cy.get('#chat-settings').should('not.exist');
  });
});
