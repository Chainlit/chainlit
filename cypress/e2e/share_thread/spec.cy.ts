import { submitMessage } from '../../support/testUtils';

const login = (user: 'a' | 'b') => {
  cy.visit('/');
  cy.location('pathname').should('eq', '/login');
  cy.get("input[name='email']").clear().type(user);
  cy.get("input[name='password']").clear().type(user);
  cy.get("button[type='submit']").click();
  cy.location('pathname').should('eq', '/');
};

function shareCurrentThread() {
  // Open header share from toolbar
  cy.get('[data-testid="header-share-button"]').click();
  // The Share dialog opens; click copy to create/share link
  cy.contains('Share link to chat').should('be.visible');
  cy.contains('Share').click();
  cy.contains('Link copied').should('be.visible');
}

function openSharedLinkInSameTab() {
  // Clipboard may not be accessible; reconstruct URL from current thread id in path
  cy.location('pathname').then((p) => {
    const threadId = p.split('/').pop();
    cy.visit(`/share/${threadId}`);
  });
}

function getCurrentThreadId(): Cypress.Chainable<string> {
  return cy.location('pathname').then((p) => p.split('/').pop() as string);
}

describe('Thread sharing and resume behavior', () => {
  it('author resumes own thread and sees composer (no read-only banner)', () => {
    login('a');
    // Start a chat to create a thread
    submitMessage('hi');
    // Navigate to thread route
    cy.location('pathname').should('match', /\/thread\//);

    // Reload the page to trigger resume flow
    cy.reload();

    // Should render Chat (composer visible), not read-only banner
    cy.get('#message-composer').should('be.visible');
  });

  it('shared route shows no composer', () => {
    login('a');
    // Ensure we have a thread
    submitMessage('hello');
    cy.location('pathname').should('match', /\/thread\//);

    // Wait for assistant echo to render
    cy.get("[data-step-type='assistant_message']").contains('You said: hello');

    // Share and open the shared link
    shareCurrentThread();
    openSharedLinkInSameTab();

    cy.get('#message-composer').should('not.exist');

    // The shared messages should be visible
    cy.get("[data-step-type='assistant_message']").contains('You said: hello');
  });

  it('another user can view the shared thread read-only with same messages', () => {
    // Author creates and shares a thread
    login('a');
    submitMessage('from a');
    cy.location('pathname').should('match', /\/thread\//);
    cy.get("[data-step-type='assistant_message']").contains('You said: from a');
    shareCurrentThread();
    getCurrentThreadId().then((threadId) => {
      // Clear session/cookies to simulate logout
      cy.clearCookies();
      cy.clearLocalStorage();

      // Login as user b
      login('b');
      // Visit the shared link directly
      cy.visit(`/share/${threadId}`);

      cy.get('#message-composer').should('not.exist');
      // Same messages visible
      cy.get("[data-step-type='assistant_message']").contains('You said: from a');
    });
  });
});
