import { runTestServer } from '../../support/testUtils';

describe('Customize chat settings', () => {
  before(() => {
    runTestServer();
  });

  it('should update inputs', () => {
    // Open chat settings modal
    cy.get('#chat-settings-open-modal').should('exist');
    cy.get('#chat-settings-open-modal').click();
    cy.get('#chat-settings-dialog').should('exist');

    // Update inputs
    cy.get('#mui-component-select-Model').click();
    cy.contains('gpt-4').click();
    cy.get('#Model').should('have.value', 'gpt-4');

    cy.get('#Temperature').clear().type('0.4');
    cy.get('#Temperature').should('have.value', '0.4');

    cy.get('#SAI_Steps').clear().type('5');
    cy.get('#SAI_Steps').should('have.value', '50');

    cy.get('#SAI_Cfg_Scale').clear().type('2');
    cy.get('#SAI_Cfg_Scale').should('have.value', '20');

    cy.get('#SAI_Width').clear().type('140');
    cy.get('#SAI_Width').should('have.value', '1400');

    cy.get('#SAI_Height').clear().type('140');
    cy.get('#SAI_Height').should('have.value', '1400');

    cy.contains('Confirm').click();

    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Settings updated!');

    // Check if inputs are updated
    cy.get('#chat-settings-open-modal').click();
    cy.get('#Temperature').should('have.value', '0.4');
    cy.get('#SAI_Steps').should('have.value', '50');
    cy.get('#SAI_Cfg_Scale').should('have.value', '20');
    cy.get('#SAI_Width').should('have.value', '1400');
    cy.get('#SAI_Height').should('have.value', '1400');

    // Check if modal is correctly closed
    cy.contains('Cancel').click();
    cy.get('#chat-settings-dialog').should('not.exist');
  });
});
