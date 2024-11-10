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

    cy.get('#chat-input').should('have.attr', 'disabled');
    cy.get('#chat-input').should('not.have.attr', 'disabled');
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

  it('should keep chat profile description visible when hovering over a link', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    cy.get('#chat-profile-selector').parent().click();

    // Force hover over GPT-4 profile to show description
    cy.get('[data-test="select-item:GPT-4"]').trigger('mouseover', {
      force: true
    });

    // Wait for the popover to appear and check its content
    cy.get('#chat-profile-description').within(() => {
      cy.contains('Learn more').should('be.visible');
    });

    // Check if the link is present in the description and has correct attributes
    const linkSelector = '#chat-profile-description a:contains("Learn more")';
    cy.get(linkSelector)
      .should('have.attr', 'href', 'https://example.com/gpt4')
      .and('have.attr', 'target', '_blank');

    // Move mouse to the link
    cy.get(linkSelector).trigger('mouseover', { force: true });

    // Verify that the description is still visible after
    cy.get('#chat-profile-description').within(() => {
      cy.contains('Learn more').should('be.visible');
    });

    // Verify that the link is still present and clickable
    cy.get(linkSelector)
      .should('exist')
      .and('be.visible')
      .and('not.have.css', 'pointer-events', 'none')
      .and('not.have.attr', 'disabled');

    // Ensure the chat profile selector is still open
    cy.get('[data-test="select-item:GPT-4"]').should('be.visible');

    // Select GPT-4 profile
    cy.get('[data-test="select-item:GPT-4"]').click();
    cy.get('#chat-input').should('have.attr', 'disabled');
    cy.get('#chat-input').should('not.have.attr', 'disabled');

    // Verify the profile has been changed
    submitMessage('hello');
    cy.get('.step')
      .should('have.length', 2)
      .last()
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );
  });
});
