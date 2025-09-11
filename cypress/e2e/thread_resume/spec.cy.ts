import { submitMessage } from '../../support/testUtils';

const login = (user: 'alice' | 'bob') => {
  cy.visit('/');
  cy.location('pathname').should('eq', '/login');

  cy.get("input[name='email']").clear().type(user);
  cy.get("input[name='password']").clear().type(((user === 'alice') ? 'a' : 'b'));

  cy.intercept('POST', '/login').as('loginReq');
  cy.intercept('GET', '/user').as('userReq');

  cy.get("button[type='submit']").click();

  cy.location('pathname', { timeout: 10000 }).should('eq', '/');
};

describe('Thread resume (author)', () => {
  it('resumes own thread, composer visible, can continue chatting', () => {
    login('alice');

    // Start a thread
    submitMessage('hi');
    cy.location('pathname').should('match', /\/thread\//);

    // Reload to trigger resume
    cy.reload();

    // Composer present and no read-only banner
    cy.get('#message-composer').should('be.visible');
    cy.get('[data-testid="read-only-banner"]').should('not.exist');

  // Continue chatting
  submitMessage('still here');
  cy.get("[data-step-type='assistant_message']").contains('Echo: still here');
  });
});
