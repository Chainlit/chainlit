import { submitMessage } from '../../support/testUtils';

const login = (user: 'alice' | 'bob') => {
  cy.visit('/');
  cy.location('pathname').should('eq', '/login');

  cy.get("input[name='email']").clear();
  cy.get("input[name='email']").type(user);
  cy.get("input[name='password']").clear();
  cy.get("input[name='password']").type(user === 'alice' ? 'a' : 'b');

  cy.intercept('POST', '/login').as('loginReq');
  cy.intercept('GET', '/user').as('userReq');

  cy.get("button[type='submit']").click();

  cy.location('pathname', { timeout: 10000 }).should('eq', '/');
};

describe('Thread resume (author)', () => {
  it('resumes own thread, composer visible, can continue chatting', () => {
    login('alice');

    // `on_chat_start` sends its welcome message asynchronously. While the
    // message list is empty `WelcomeScreen` renders the composer and `Footer`
    // renders nothing; the first message flips `hasMessage()` and swaps which
    // of the two owns it, remounting the input. Wait for that swap before
    // typing, or the typed value is dropped mid-`type()`.
    cy.get("[data-step-type='assistant_message']").should(
      'contain',
      'Welcome, say hi to start!'
    );

    // Start a thread and let the first turn finish, so the data layer has
    // persisted it and there is a history for resume to replay.
    submitMessage('hi');
    cy.location('pathname').should('match', /\/thread\//);
    cy.get("[data-step-type='assistant_message']").should(
      'contain',
      'Echo: hi'
    );

    // Reload to trigger resume
    cy.reload();

    // Composer present and no read-only banner
    cy.get('#message-composer').should('be.visible');
    cy.get('[data-testid="read-only-banner"]').should('not.exist');

    // `#message-composer` is visible well before the thread has hydrated. The
    // backend's resume path emits, in order: the `@cl.on_chat_resume` message,
    // then `resume_thread` with the persisted history -- and the client's
    // `resume_thread` handler *replaces* the whole message list with it. So
    // `Echo: hi` can only come from that replay, which is the last write to
    // the list; once it is on screen every resume event has landed and the
    // composer has stopped remounting.
    cy.get("[data-step-type='assistant_message']").should(
      'contain',
      'Echo: hi'
    );

    // Continue chatting
    submitMessage('still here');
    cy.get("[data-step-type='assistant_message']").contains('Echo: still here');
  });
});
