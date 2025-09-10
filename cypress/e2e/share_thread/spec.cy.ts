import { submitMessage } from '../../support/testUtils';

const login = (user: 'a' | 'b') => {
  cy.visit('/');
  cy.location('pathname').should('eq', '/login');
  cy.get("input[name='email']").clear().type(user);
  cy.get("input[name='password']").clear().type(user);
  cy.intercept('POST', '/login').as('loginReq');
  cy.intercept('GET', '/user').as('userReq');
  cy.get("button[type='submit']").click();
  cy.location('pathname', { timeout: 10000 }).should('eq', '/');
};

function clickShareToolbarButton() {
  // The share button appears after a thread exists. Try data-testid first then fallback to icon-based selector.
  cy.get('button[data-testid="header-share-button"],button:has(svg.lucide-share2)')
    .first()
    .should('be.visible')
    .click();
}

function shareThreadAndCaptureLink(): Cypress.Chainable<string> {
  clickShareToolbarButton();
  cy.contains('Share link to chat').should('be.visible');
  cy.contains('Share').click();
  cy.contains('Link copied').should('be.visible');
  // Clipboard access in Cypress can be flaky; derive from current pathname which is /thread/<id>
  return cy.location('pathname').then((p) => p.replace(/^\//, ''));
}

describe('Thread sharing end-to-end flow', () => {
  it('author shares a thread and both author and another user view read-only shared route', () => {
    // 1. Login as user a
    login('a');

    // 2. Submit a message (assistant echoes)
    submitMessage('hello world');
    cy.location('pathname').should('match', /\/thread\//);
    cy.get("[data-step-type='assistant_message']").contains('You said: hello world');

    // 3 & 4. Share the thread and capture link (/thread/<uuid>)
    shareThreadAndCaptureLink().then((threadPath) => {
      // Expect threadPath like thread/<uuid>
      expect(threadPath).to.match(/^thread\/[0-9a-fA-F-]+$/);

      // Build shared URL variant /share/<uuid> (public read-only) and original thread URL
      const threadId = threadPath.split('/')[1];
      const sharedUrl = `/share/${threadId}`;
      const originalUrl = `/${threadPath}`;

      // 5. Visit the shared link as author; composer should be hidden
      cy.visit(sharedUrl);
      cy.location('pathname').should('eq', `/share/${threadId}`);
      cy.get('#message-composer').should('not.exist');
      cy.get("[data-step-type='assistant_message']").contains('You said: hello world');

      // Sanity: original thread still shows composer
      cy.visit(originalUrl);
      cy.get('#message-composer').should('be.visible');

      // 6. Logout
      cy.visit('/logout');
      cy.location('pathname').should('eq', '/login');

      // 7. Login as user b
      login('b');

      // 8. Visit the shared link again; composer should not exist, message visible
      cy.visit(sharedUrl);
      cy.get('#message-composer').should('not.exist');
      cy.get("[data-step-type='assistant_message']").contains('You said: hello world');
    });
  });
});
