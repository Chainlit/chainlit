import { sep } from 'path';

import { runTestServer, submitMessage } from '../../support/testUtils';
import { ExecutionMode } from '../../support/utils';

// Constants for selectors and timeouts
const SELECTORS = {
  EMAIL_INPUT: '#email',
  PASSWORD_INPUT: '#password',
  POSITIVE_FEEDBACK: '.positive-feedback-off',
  NEGATIVE_FEEDBACK: '.negative-feedback-off',
  SUBMIT_FEEDBACK: '#submit-feedback',
  POSITIVE_FEEDBACK_ACTIVE: '.positive-feedback-on',
  STEP: '.step',
  THREAD_TEST1: '#thread-test1',
  THREAD_TEST2: '#thread-test2',
  THREAD_OPTIONS: '#thread-options',
  DELETE_THREAD: '#delete-thread',
  CONFIRM_BUTTON: "[role='alertdialog'] button.bg-primary",
  NEW_CHAT_BUTTON: '#new-chat-button',
  CONFIRM_NEW: '#confirm'
} as const;

const TIMEOUTS = {
  SHORT: 100,
  MEDIUM: 1000,
  LONG: 2000
} as const;

// Types
interface ServerEnv {
  THREAD_HISTORY_PICKLE_PATH: string;
  [key: string]: string;
}

// Utility functions
const login = () => {
  // If the email input is present, perform login, otherwise assume already logged in.
  cy.get('body').then(($body) => {
    if ($body.find(SELECTORS.EMAIL_INPUT).length) {
      cy.get(SELECTORS.EMAIL_INPUT).should('be.visible').type('admin');
      cy.get(SELECTORS.PASSWORD_INPUT)
        .should('be.visible')
        .type('admin{enter}');
    }
  });
};

const verifyFeedback = () => {
  cy.location('pathname').should('eq', '/');
  submitMessage('Hello');
  cy.location('pathname').should('match', /^\/thread\//);

  cy.get(SELECTORS.NEGATIVE_FEEDBACK).should('have.length', 1);
  cy.get(SELECTORS.POSITIVE_FEEDBACK).should('have.length', 1).first().click();
  cy.get(SELECTORS.SUBMIT_FEEDBACK).should('be.visible').click();
  cy.get(SELECTORS.POSITIVE_FEEDBACK_ACTIVE).should('have.length', 1);
};

const verifyThreadQueue = () => {
  cy.get(SELECTORS.STEP).eq(1).should('contain.text', 'Create step counter: 0');
  cy.get(SELECTORS.STEP).eq(3).should('contain.text', 'Create step counter: 5');
  cy.get(SELECTORS.STEP).eq(6).should('contain.text', 'Create step counter: 8');
};

const verifyThreadList = () => {
  cy.get(SELECTORS.THREAD_TEST1).should('contain.text', 'thread 1');
  cy.get(SELECTORS.THREAD_TEST2).should('contain.text', 'thread 2');

  // Test thread page
  cy.get(SELECTORS.THREAD_TEST1).click();
  cy.get(SELECTORS.STEP).should('have.length', 2);
  cy.get(SELECTORS.STEP).eq(0).should('contain.text', 'Message 1');
  cy.get(SELECTORS.STEP).eq(1).should('contain.text', 'Message 2');

  // Test thread deletion
  cy.get(SELECTORS.THREAD_TEST1).find(SELECTORS.THREAD_OPTIONS).click();
  cy.wait(TIMEOUTS.SHORT);
  cy.get(SELECTORS.DELETE_THREAD).click();
  cy.wait(TIMEOUTS.SHORT);
  cy.get(SELECTORS.CONFIRM_BUTTON).click();
  cy.wait(TIMEOUTS.SHORT);
  cy.get(SELECTORS.THREAD_TEST1).should('not.exist');
  cy.get('body').type('{esc}');
};

const verifyThreadResume = () => {
  cy.get('body').should('have.css', 'pointer-events', 'auto');
  cy.get(SELECTORS.THREAD_TEST2).click();
  cy.wait(TIMEOUTS.MEDIUM);
  cy.get('a').contains('Hello').click();
  cy.wait(TIMEOUTS.MEDIUM);

  cy.get(SELECTORS.STEP).should('have.length', 10);
  cy.get(SELECTORS.STEP).eq(0).should('contain.text', 'Hello');
  cy.get(SELECTORS.STEP).eq(7).should('contain.text', 'Welcome back to Hello');
  cy.get(SELECTORS.STEP).eq(8).should('contain.text', 'chat_profile');
};

const restartServer = (mode: ExecutionMode | undefined, env: ServerEnv) => {
  const pathItems = Cypress.spec.absolute.split(sep);
  const testName = pathItems[pathItems.length - 2];

  cy.exec(
    `pnpm exec ts-node ./cypress/support/run.ts ${testName} ${mode || ''}`,
    {
      env,
      failOnNonZeroExit: false
    }
  ).then((result) => {
    if (result.code !== 0) {
      throw new Error(`Server restart failed: ${result.stderr}`);
    }
  });
};

const verifyContinueThread = () => {
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
  cy.get(SELECTORS.NEW_CHAT_BUTTON).click();
  cy.get(SELECTORS.CONFIRM_NEW).click();
};

describe('Data Layer', () => {
  let threadHistoryFile: string;

  beforeEach(() => {
    // Set up the thread history file
    const pathItems = Cypress.spec.absolute.split(sep);
    pathItems[pathItems.length - 1] = 'thread_history.pickle';
    threadHistoryFile = pathItems.join(sep);

    runTestServer(undefined, {
      THREAD_HISTORY_PICKLE_PATH: threadHistoryFile
    });
  });

  afterEach(async () => {
    const { platform } = await import('os');

    // Clean up thread history file
    const command =
      platform() === 'win32'
        ? `del /f "${threadHistoryFile}"`
        : `rm -f "${threadHistoryFile}"`;
    cy.exec(command, { failOnNonZeroExit: false });
  });

  describe('Data Features with Persistence', () => {
    it('Verifies login, feedback, thread queue, thread list, and thread resume functionality', () => {
      login();
      cy.wait(TIMEOUTS.MEDIUM);
      verifyFeedback();
      verifyThreadQueue();
      verifyThreadList();
      verifyThreadResume();
    });

    it('Verifies thread continuation after server restart and new thread creation', () => {
      login();
      cy.wait(TIMEOUTS.MEDIUM);
      verifyFeedback();
      verifyThreadQueue();

      restartServer(undefined, {
        THREAD_HISTORY_PICKLE_PATH: threadHistoryFile
      });
      cy.reload();

      verifyContinueThread();
      startNewThread();
      cy.wait(TIMEOUTS.MEDIUM);
      verifyFeedback();
      verifyThreadQueue();
    });
  });
});
