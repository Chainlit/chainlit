import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Chat profiles', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to select a chat profile', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    cy.wait(1000);
    cy.get('#starter-say-hi').should('exist').click();

    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Start a conversation with a greeting');

    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'starting chat with admin using the GPT-3.5 chat profile'
      );

    cy.get('#chat-profile-selector').parent().click();
    cy.get('[data-test="select-item:GPT-3.5"]').should('exist');
    cy.get('[data-test="select-item:GPT-4"]').should('exist');
    cy.get('[data-test="select-item:GPT-5"]').should('exist');

    // Change chat profile

    cy.get('[data-test="select-item:GPT-4"]').click();
    cy.get('#confirm').click();

    cy.wait(1000);
    cy.get('#starter-ask-for-help').should('exist').click();

    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Ask for help with something');

    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );

    cy.get('#header').get('#new-chat-button').click({ force: true });
    cy.get('#confirm').click();

    cy.get('#starter-ask-for-help').should('exist');

    cy.get('.step').should('have.length', 0);

    submitMessage('hello');
    cy.get('.step').should('have.length', 2).eq(0).should('contain', 'hello');
    cy.get('#chat-profile-selector').parent().click();
    cy.get('[data-test="select-item:GPT-5"]').click();
    cy.get('#confirm').click();

    cy.get('#starter-ask-for-help').should('exist');
  });
});
