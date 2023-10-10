import { runTestServer } from '../../support/testUtils';

describe('Chat profiles', () => {
  before(() => {
    runTestServer();
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('not.exist');
  });

  it('should be able to select a chat profile', () => {
    cy.get('[data-test="chat-profile:GPT-3.5"]').should('exist');
    cy.get('[data-test="chat-profile:GPT-4"]').should('exist');

    cy.get('[data-test="chat-profile:GPT-3.5"]').click();

    cy.get('.message').should(
      'contain',
      'starting chat with admin using the GPT-3.5 chat profile'
    );

    cy.get('[data-test="chat-profile:GPT-3.5"]').should('not.exist');
    cy.get('[data-test="chat-profile:GPT-4"]').should('not.exist');

    // New conversation

    cy.get('#new-chat-button').click();
    cy.get('#confirm').click();

    cy.get('[data-test="chat-profile:GPT-3.5"]').should('exist');
    cy.get('[data-test="chat-profile:GPT-4"]').should('exist');

    cy.get('[data-test="chat-profile:GPT-4"]').click();

    cy.get('.message').should(
      'contain',
      'starting chat with admin using the GPT-4 chat profile'
    );

    cy.get('[data-test="chat-profile:GPT-3.5"]').should('not.exist');
    cy.get('[data-test="chat-profile:GPT-4"]').should('not.exist');
  });
});
