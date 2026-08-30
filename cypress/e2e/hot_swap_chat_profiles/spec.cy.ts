import { submitMessage } from '../../support/testUtils';

describe('Hot-swap chat profiles in active conversation', () => {
  it('should switch chat profiles in-place without resetting thread or showing confirm modal', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    // 1. Send first message on initial profile (GPT-3.5)
    submitMessage('First message to GPT-3.5');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).should('contain', 'First message to GPT-3.5');
    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'Echo: First message to GPT-3.5 (profile: GPT-3.5, user: admin)'
      );

    // 2. Hot-swap to GPT-4
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:GPT-4"]').should('be.visible').click();

    // Verify confirmation modal does NOT appear
    cy.get('#confirm').should('not.exist');

    // Verify previous conversation history remains intact
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).should('contain', 'First message to GPT-3.5');
    cy.get('.step').eq(1).should('contain', 'profile: GPT-3.5');

    // 3. Send second message on swapped profile (GPT-4)
    submitMessage('Second message to GPT-4');

    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).should('contain', 'Second message to GPT-4');
    cy.get('.step')
      .eq(3)
      .should(
        'contain',
        'Echo: Second message to GPT-4 (profile: GPT-4, user: admin)'
      );

    // 4. Hot-swap to GPT-5
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:GPT-5"]').should('be.visible').click();

    cy.get('#confirm').should('not.exist');

    // 5. Send third message on GPT-5
    submitMessage('Third message to GPT-5');

    cy.get('.step').should('have.length', 6);
    cy.get('.step').eq(4).should('contain', 'Third message to GPT-5');
    cy.get('.step')
      .eq(5)
      .should(
        'contain',
        'Echo: Third message to GPT-5 (profile: GPT-5, user: admin)'
      );

    // 6. Test explicit New Chat button still opens confirm dialog and clears thread
    cy.get('#header').find('#new-chat-button').click({ force: true });
    cy.get('#confirm').should('be.visible').click();

    cy.get('.step').should('have.length', 0);
  });
});
