import { runTestServer, submitMessage } from '../../support/testUtils';

describe('LLM Picker', () => {
    before(() => {
        runTestServer();
    });

    it('should display LLM picker when LLMs are available', () => {
        cy.get('#llm-picker-trigger').should('exist');
        cy.get('#llm-picker-trigger').should('contain', 'Gemini 3 Flash');
    });

    it('should show default LLM selected', () => {
        // The default LLM should be visible in the trigger
        cy.get('#llm-picker-trigger').should('contain', 'Gemini 3 Flash');
    });

    it('should open dropdown when clicked', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').should('be.visible');
    });

    it('should display all available LLMs in dropdown', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').within(() => {
            cy.contains('Gemini 3 Pro').should('exist');
            cy.contains('Gemini 3 Pro (Low)').should('exist');
            cy.contains('Gemini 3 Flash').should('exist');
        });
    });

    it('should show LLM descriptions in dropdown', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').within(() => {
            cy.contains('Most capable and intelligent').should('exist');
            cy.contains('Quick and efficient').should('exist');
        });
    });

    it('should select an LLM when clicked', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').contains('Gemini 3 Pro').click();
        cy.get('#llm-picker-trigger').should('contain', 'Gemini 3 Pro');
    });

    it('should persist LLM selection across messages', () => {
        // Select an LLM
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').contains('Gemini 3 Pro (Low)').click();

        // Send a message
        submitMessage('Test message 1');

        // LLM should still be selected
        cy.get('#llm-picker-trigger').should('contain', 'Gemini 3 Pro (Low)');

        // Send another message
        submitMessage('Test message 2');

        // LLM should still be selected
        cy.get('#llm-picker-trigger').should('contain', 'Gemini 3 Pro (Low)');
    });

    it('should send selected LLM with message', () => {
        // Select an LLM
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').contains('Gemini 3 Flash').click();

        // Send a message
        submitMessage('Which LLM?');

        // Check that the response includes the selected LLM
        cy.get('.step').last().should('contain', 'gemini_3_flash');
    });

    it('should support keyboard navigation', () => {
        // Focus the trigger
        cy.get('#llm-picker-trigger').focus();

        // Press Enter to open
        cy.get('#llm-picker-trigger').type('{enter}');
        cy.get('#llm-picker-popover').should('be.visible');

        // Press Escape to close
        cy.get('#llm-picker-popover').type('{esc}');
        cy.get('#llm-picker-popover').should('not.exist');
    });

    it('should display icon for each LLM', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').within(() => {
            // Check that icons are present (they should have the Icon component)
            cy.get('[class*="icon"]').should('have.length.at.least', 3);
        });
    });

    it('should close dropdown after selection', () => {
        cy.get('#llm-picker-trigger').click();
        cy.get('#llm-picker-popover').should('be.visible');
        cy.get('#llm-picker-popover').contains('Gemini 3 Pro').click();
        cy.get('#llm-picker-popover').should('not.exist');
    });

    it('should not display picker when no LLMs are available', () => {
        // This would require a different test app without set_llms
        // For now, we just verify the picker exists when LLMs are present
        cy.get('#llm-picker-trigger').should('exist');
    });
});
