import { platform } from 'os';
import { sep } from 'path';

import { submitMessage } from '../../support/testUtils';

// Constants
const SELECTORS = {
  EMAIL_INPUT: '#email',
  PASSWORD_INPUT: '#password',
  AI_MESSAGE: "[data-step-type='assistant_message']",
  CHAT_SUBMIT: '#chat-submit',
  POSITIVE_FEEDBACK: '.positive-feedback-off',
  NEGATIVE_FEEDBACK: '.negative-feedback-off',
  SUBMIT_FEEDBACK: '#submit-feedback',
  POSITIVE_FEEDBACK_ACTIVE: '.positive-feedback-on',
  STEP: '.step',
  THREAD_HISTORY: '#thread-history',
  THREAD_TEST1: '#thread-test1',
  THREAD_TEST2: '#thread-test2',
  THREAD_OPTIONS: '#thread-options',
  DELETE_THREAD: '#delete-thread',
  CONFIRM_BUTTON: "[role='alertdialog'] button.bg-primary",
  NEW_CHAT_BUTTON: '#new-chat-button',
  CONFIRM_NEW: '#confirm',
  LOADER: '.lucide-loader'
} as const;

// Utility functions

const login = (username: string = 'user1', password: string = 'user1') => {
  cy.step('Verify login');

  cy.location('pathname').should('eq', '/login');

  cy.get(SELECTORS.EMAIL_INPUT).should('be.visible').type(username);
  cy.get(SELECTORS.PASSWORD_INPUT)
    .should('be.visible')
    .type(`${password}{enter}`);
};

const startConversation = () => {
  cy.step('Start conversation');

  cy.location('pathname').should('eq', '/');

  cy.get(SELECTORS.AI_MESSAGE)
    .should('exist')
    .and('be.visible')
    .and('have.length', 2);

  submitMessage('Hello');

  cy.location('pathname').should('match', /^\/thread\//);

  cy.get(SELECTORS.AI_MESSAGE).should('exist').and('be.visible');
};

const verifyFeedback = () => {
  cy.step('Verify feedback');

  cy.get(SELECTORS.NEGATIVE_FEEDBACK).should('have.length', 1);
  cy.get(SELECTORS.POSITIVE_FEEDBACK).should('have.length', 1).first().click();
  cy.get(SELECTORS.SUBMIT_FEEDBACK).should('be.visible').click();
  cy.get(SELECTORS.POSITIVE_FEEDBACK_ACTIVE).should('have.length', 1);
};

const verifyThreadQueue = () => {
  cy.step('Verify thread queue');

  cy.get(SELECTORS.STEP).eq(1).should('contain.text', 'Create step counter: 0');
  cy.get(SELECTORS.STEP).eq(3).should('contain.text', 'Create step counter: 5');
  cy.get(SELECTORS.STEP).eq(6).should('contain.text', 'Create step counter: 8');
};

const verifyThreadList = () => {
  cy.step('Verify thread list');

  cy.get(SELECTORS.THREAD_TEST1).should('contain.text', 'thread 1');
  cy.get(SELECTORS.THREAD_TEST2).should('contain.text', 'thread 2');

  cy.step('Verify thread page');

  cy.get(SELECTORS.THREAD_TEST1).click();
  cy.get(SELECTORS.STEP).should('have.length', 2);
  cy.get(SELECTORS.STEP).eq(0).should('contain.text', 'Message 1');
  cy.get(SELECTORS.STEP).eq(1).should('contain.text', 'Message 2');

  cy.step('Verify thread deletion');

  cy.get(SELECTORS.THREAD_TEST1).find(SELECTORS.THREAD_OPTIONS).click();
  cy.get(SELECTORS.DELETE_THREAD).should('be.visible').click();
  cy.get(SELECTORS.CONFIRM_BUTTON).should('be.visible').click();
  cy.get(SELECTORS.THREAD_TEST1).should('not.exist');
  cy.get('body').type('{esc}');
};

const verifyThreadResume = () => {
  cy.step('Verify thread resume');

  cy.get('body').should('have.css', 'pointer-events', 'auto');

  cy.get(SELECTORS.THREAD_TEST2).click();
  cy.get(SELECTORS.LOADER).should('not.be.visible');

  cy.get(SELECTORS.THREAD_HISTORY).contains('Hello').click();
  cy.get(SELECTORS.LOADER).should('not.be.visible');

  cy.get(SELECTORS.STEP).should('have.length', 10);
  cy.get(SELECTORS.STEP).eq(0).should('contain.text', 'Hello');
  cy.get(SELECTORS.STEP).eq(7).should('contain.text', 'Welcome back to Hello');
  cy.get(SELECTORS.STEP).eq(8).should('contain.text', 'chat_profile');
};

const verifyContinueThread = () => {
  cy.step('Verify thread continuation');

  cy.get(SELECTORS.STEP).eq(7).should('contain.text', 'Welcome back to Hello');
  submitMessage('Hello after restart');

  cy.get(SELECTORS.STEP)
    .eq(11)
    .should('contain.text', 'Create step counter: 14');
  cy.get(SELECTORS.STEP)
    .eq(14)
    .should('contain.text', 'Create step counter: 17');
};

const startNewThread = () => {
  cy.step('Start new thread');

  cy.get(SELECTORS.NEW_CHAT_BUTTON).click();
  cy.get(SELECTORS.CONFIRM_NEW).click();
};

const cleanupThreadHistory = () => {
  const pathItems = Cypress.spec.absolute.split(sep);
  pathItems[pathItems.length - 1] = 'thread_history.pickle';
  const threadHistoryFile = pathItems.join(sep);

  // Clean up thread history file
  const command =
    platform() === 'win32'
      ? `del /f "${threadHistoryFile}"`
      : `rm -f "${threadHistoryFile}"`;
  cy.exec(command, { failOnNonZeroExit: false });
};

describe('Data Layer', () => {
  describe('Data Features with Persistence', () => {
    before(cleanupThreadHistory);
    afterEach(cleanupThreadHistory);

    it('Verifies login, feedback, thread queue, thread list, and thread resume functionality', () => {
      login();
      startConversation();

      verifyFeedback();
      verifyThreadQueue();

      verifyThreadList();
      verifyThreadResume();
    });

    it('Verifies thread continuation after server restart and new thread creation', () => {
      cy.task('restartChainlit', Cypress.spec).then(() => {
        cy.section('Before server restart');

        cy.visit('/');

        login();
        startConversation();

        verifyFeedback();
        verifyThreadQueue();
      });

      cy.task('restartChainlit', Cypress.spec).then(() => {
        cy.section('After server restart');

        verifyContinueThread();

        startNewThread();
        startConversation();

        verifyFeedback();
        verifyThreadQueue();
      });
    });
  });
});

describe('Access Control', () => {
  before(cleanupThreadHistory);

  it("should not allow steal user's thread", () => {
    login('user1', 'user1');
    startConversation();

    let stolenThreadId = '';
    cy.location('pathname')
      .should('match', /^\/thread\//)
      .then((pathname) => {
        const parts = pathname.split('/');
        stolenThreadId = parts[2];
        expect(stolenThreadId).to.match(/^[a-zA-Z0-9_-]+$/);
      });

    cy.clearCookies();
    cy.clearLocalStorage();

    login('user2', 'user2');

    cy.intercept(
      {
        method: 'POST',
        url: /\/ws\/socket\.io\/.*transport=polling/
      },
      (request) => {
        if (
          typeof request.body === 'string' &&
          request.body.includes('"threadId"')
        ) {
          request.body = request.body.replace(
            /("threadId":\s*")[^"]*(")/,
            `$1${stolenThreadId}$2`
          );
          expect(request.url).to.include('/ws/socket.io/');
          expect(request.body).to.include(`"threadId":"${stolenThreadId}"`);
        }
      }
    ).as('threadHijack');
    startNewThread();

    cy.get(SELECTORS.STEP).should('have.length', 0);
  });
});
