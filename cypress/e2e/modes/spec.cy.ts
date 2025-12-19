import { submitMessage } from '../../support/testUtils';

describe('Modes Picker', () => {
  // Taller viewport reduces header overlap in headless + absolute-positioned menus
  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it('should display mode pickers when modes are available', () => {
    // Wait for chat input to be ready (indicates modes are loaded)
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').should('exist');
    cy.get('#mode-picker-trigger-reasoning').should('exist');
  });

  it('should show default options selected', () => {
    cy.get('#chat-input').should('exist');

    // The default model should be visible in the trigger
    cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Flash');
    // The default reasoning should be visible
    cy.get('#mode-picker-trigger-reasoning').should('contain', 'Medium');
  });

  it('should open dropdown when model picker is clicked', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').should('be.visible');
  });

  it('should display all model options in dropdown', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').within(() => {
      cy.contains('Gemini 3 Pro').should('exist');
      cy.contains('Gemini 3 Flash').should('exist');
    });
  });

  it('should display all reasoning options in dropdown', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-reasoning').click();
    cy.get('#mode-picker-popover-reasoning').within(() => {
      cy.contains('High').should('exist');
      cy.contains('Medium').should('exist');
      cy.contains('Low').should('exist');
    });
  });

  it('should show option descriptions in dropdown', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').within(() => {
      cy.contains('Most capable and intelligent').should('exist');
      cy.contains('Quick and efficient').should('exist');
    });
  });

  it('should select a model option when clicked', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();
    cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
  });

  it('should select a reasoning option when clicked', () => {
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-reasoning').click();
    cy.get('#mode-picker-popover-reasoning').contains('High').click();
    cy.get('#mode-picker-trigger-reasoning').should('contain', 'High');
  });

  it('should persist mode selections across messages', () => {
    cy.get('#chat-input').should('exist');
    // Wait for mode pickers to load
    cy.get('#mode-picker-trigger-model', { timeout: 10000 }).should('exist');
    cy.get('#mode-picker-trigger-reasoning', { timeout: 10000 }).should(
      'exist'
    );

    // Log initial state
    cy.get('#mode-picker-trigger-model')
      .invoke('text')
      .then((text) => {
        cy.log('Initial model picker text: ' + text);
      });

    // Select model
    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();

    // Log after model selection
    cy.get('#mode-picker-trigger-model')
      .invoke('text')
      .then((text) => {
        cy.log('After model selection: ' + text);
      });

    // Select reasoning
    cy.get('#mode-picker-trigger-reasoning').click();
    cy.get('#mode-picker-popover-reasoning').contains('Low').click();

    // Log after reasoning selection
    cy.get('#mode-picker-trigger-reasoning')
      .invoke('text')
      .then((text) => {
        cy.log('After reasoning selection: ' + text);
      });

    // Send a message
    submitMessage('Test message 1');

    // Wait for response (at least 2 steps: user + assistant)
    cy.get('.step').should('have.length.at.least', 2);

    // Log mode pickers after first message
    cy.get('#mode-picker-trigger-model')
      .invoke('text')
      .then((text) => {
        cy.log('After first message - model: ' + text);
      });
    cy.get('#mode-picker-trigger-reasoning')
      .invoke('text')
      .then((text) => {
        cy.log('After first message - reasoning: ' + text);
      });

    // Modes should still be selected
    cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
    cy.get('#mode-picker-trigger-reasoning').should('contain', 'Low');

    // Send another message
    submitMessage('Test message 2');

    // Wait for response (at least 4 steps: 2 user + 2 assistant)
    cy.get('.step').should('have.length.at.least', 4);

    // Log mode pickers after second message
    cy.get('#mode-picker-trigger-model')
      .invoke('text')
      .then((text) => {
        cy.log('After second message - model: ' + text);
      });
    cy.get('#mode-picker-trigger-reasoning')
      .invoke('text')
      .then((text) => {
        cy.log('After second message - reasoning: ' + text);
      });

    // Modes should still be selected
    cy.get('#mode-picker-trigger-model').should('contain', 'Gemini 3 Pro');
    cy.get('#mode-picker-trigger-reasoning').should('contain', 'Low');
  });

  it('should send selected modes with message', () => {
    cy.get('#chat-input').should('exist');

    // Select model
    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').contains('Gemini 3 Flash').click();

    // Select reasoning
    cy.get('#mode-picker-trigger-reasoning').click();
    cy.get('#mode-picker-popover-reasoning').contains('High').click();

    // Send a message
    submitMessage('Which modes?');

    // Wait for response and check content
    cy.get('.step').should('have.length', 2);
    cy.get('.step').last().should('contain', 'gemini_3_flash');
    cy.get('.step').last().should('contain', 'high');
  });

  it('should support keyboard navigation', () => {
    cy.get('#chat-input').should('exist');

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
    cy.get('#chat-input').should('exist');

    cy.get('#mode-picker-trigger-model').click();
    cy.get('#mode-picker-popover-model').should('be.visible');
    cy.get('#mode-picker-popover-model').contains('Gemini 3 Pro').click();
    cy.get('#mode-picker-popover-model').should('not.exist');
  });

  it('should handle independent mode selections', () => {
    cy.get('#chat-input').should('exist');

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
