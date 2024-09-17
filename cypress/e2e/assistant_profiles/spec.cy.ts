import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Assistant profiles', () => {
  before(() => {
    runTestServer();
  });

  it('should select assistant profile', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    // Open chat settings modal
    cy.get('#open-sidebar-button').should('exist');
    cy.get('#open-sidebar-button').click();

    // Select the first assistant profile
    cy.get('[id^="assistant-profile-"]')
      .should('have.length', 1)
      .first()
      .click();
    cy.get('[id^="assistant-info-screen"]').should('be.visible');
  });

  it('should create new assistant profile', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    // Wait for the page to load
    cy.get('#open-sidebar-button').should('be.visible');
    cy.get('#open-sidebar-button').click();
    cy.get('[id^="assistant-profile-"]').should('be.visible');

    // Create new assistant profile
    cy.get('#new-assistant-button').should('be.visible').click();
    cy.get('#name').should('be.visible');

    // Fill out the form
    cy.get('#name').type('Test Assistant');
    cy.get('#markdown_description').type('This is a test assistant');
    cy.get('#instructions').type('You are a test assistant');
    cy.get('#model').parent().click();
    cy.contains('gpt-4o').click();
    cy.get('#temperature').invoke('val', 0.7).trigger('change');
    cy.get('#confirm').click();

    // Verify new assistant profile
    cy.get('[id^="assistant-profile-"]').should('have.length', 2);
    cy.get('[id^="assistant-profile-"]').last().click();
    cy.get('[id^="assistant-info-screen"]')
      .should('be.visible')
      .and('contain', 'Test Assistant');
  });

  it('should edit assistant profile', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    // Wait for the page to load
    cy.get('#open-sidebar-button').should('be.visible');
    cy.get('#open-sidebar-button').click();
    cy.get('[id^="assistant-profile-"]').should('be.visible');
    cy.get('[id^="edit-assistant-"]').should('be.visible').first().click();
    cy.get('#name').should('be.visible');

    // Fill out the form
    cy.get('#name').clear().type('New name');
    cy.get('#markdown_description').clear().type('New description');
    cy.get('#instructions').clear().type('New instructions');
    cy.get('#confirm').click();

    // Verify edited assistant profile
    cy.get('[id^="assistant-profile-"]').last().click();
    cy.get('[id^="assistant-info-screen"]')
      .should('be.visible')
      .and('contain', 'New name');
  });

  it('should send message to assistant', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    cy.get('#open-sidebar-button').should('be.visible');
    cy.get('#open-sidebar-button').click();
    cy.get('[id^="assistant-profile-"]').should('be.visible');
    cy.get('[id^="assistant-profile-"]').last().click();
    cy.get('[id^="assistant-info-screen"]').should('be.visible');
    submitMessage('Hello');
    cy.get('[id^="step-"]')
      .should('be.visible')
      .and(
        'contain',
        'Passed content: Hello to assistant: <chainlit.assistant.Assistant object at '
      );
  });
});
