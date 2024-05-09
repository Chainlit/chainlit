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

    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
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

    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );

    cy.get('#header').get('#new-chat-button').click({ force: true });
    cy.get('#confirm').click();

    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );

    submitMessage('hello');
    cy.get('.step').should('have.length', 2).eq(1).should('contain', 'hello');
    cy.get('#chat-profile-selector').parent().click();
    cy.get('[data-test="select-item:GPT-5"]').click();
    cy.get('#confirm').click();

    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-5 chat profile'
      );
  });
});
