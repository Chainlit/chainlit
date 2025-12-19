import { submitMessage } from '../../support/testUtils';

describe('Modes Picker', () => {

    it('should display mode pickers when modes are available', () => {
        cy.get('#mode-picker-trigger-model').should('exist');
        cy.get('#mode-picker-trigger-reasoning').should('exist');
    });

    it('should show default options selected', () => {
        // The default model should be visible in the trigger
        cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Flash');
        // The default reasoning should be visible
        cy.get('#mode-picker-trigger-reasoning').should('contain', 'Medium');
    });

    it('should open dropdown when model picker is clicked', () => {
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').should('be.visible');
    });

    it('should display all model options in dropdown', () => {
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').within(() => {
            cy.contains('Gemini 3 Pro').should('exist');
            cy.contains('Gemini 3 Flash').should('exist');
        });
    });

    it('should display all reasoning options in dropdown', () => {
        cy.get('#mode-picker-trigger-reasoning').click();
        cy.get('#mode-picker-popover-reasoning').within(() => {
            cy.contains('High').should('exist');
            cy.contains('Medium').should('exist');
            cy.contains('Low').should('exist');
        });
    });

    it('should show option descriptions in dropdown', () => {
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').within(() => {
            cy.contains('Most capable and intelligent').should('exist');
            cy.contains('Quick and efficient').should('exist');
        });
    });

    it('should select a model option when clicked', () => {
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();
        cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
    });

    it('should select a reasoning option when clicked', () => {
        cy.get('#mode-picker-trigger-reasoning').click();
        cy.get('#mode-picker-popover-reasoning').contains('High').click();
        cy.get('#mode-picker-trigger-reasoning').should('contain', 'High');
    });

    it('should persist mode selections across messages', () => {
        // Select model
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();

        // Select reasoning
        cy.get('#mode-picker-trigger-reasoning').click();
        cy.get('#mode-picker-popover-reasoning').contains('Low').click();

        // Send a message
        submitMessage('Test message 1');

        // Modes should still be selected
        cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
        cy.get('#mode-picker-trigger-reasoning').should('contain', 'Low');

        // Send another message
        submitMessage('Test message 2');

        // Modes should still be selected
        cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
        cy.get('#mode-picker-trigger-reasoning').should('contain', 'Low');
    });

    it('should send selected modes with message', () => {
        // Select model
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').contains('Gemini 3 Flash').click();

        // Select reasoning
        cy.get('#mode-picker-trigger-reasoning').click();
        cy.get('#mode-picker-popover-reasoning').contains('High').click();

        // Send a message
        submitMessage('Which modes?');

        // Check that the response includes the selected modes
        cy.get('.step').last().should('contain', 'gemini_3_flash');
        cy.get('.step').last().should('contain', 'high');
    });

    it('should support keyboard navigation', () => {
        // Focus the model trigger
        cy.get('#mode-picker-trigger-model').focus();

        // Press Enter to open
        cy.get('#mode-picker-trigger-model').type('{enter}');
        cy.get('#mode-picker-popover-model').should('be.visible');

        // Press Escape to close
        cy.get('#mode-picker-popover-model').type('{esc}');
        cy.get('#mode-picker-popover-model').should('not.exist');
    });

    it('should close dropdown after selection', () => {
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').should('be.visible');
        cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();
        cy.get('#mode-picker-popover-model').should('not.exist');
    });

    it('should handle independent mode selections', () => {
        // Select model without changing reasoning
        cy.get('#mode-picker-trigger-model').click();
        cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();

        // Reasoning should still be at default
        cy.get('#mode-picker-trigger-reasoning').should('contain', 'Medium');

        // Now change reasoning
        cy.get('#mode-picker-trigger-reasoning').click();
        cy.get('#mode-picker-popover-reasoning').contains('High').click();

        // Model should still be Gemini 3 Pro
        cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
    });
});
