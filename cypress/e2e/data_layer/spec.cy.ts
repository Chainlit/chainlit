import { runTestServer, submitMessage } from '../../support/testUtils';

function login() {
  cy.get("[id='email']").type('admin');
  cy.get("[id='password']").type('admin{enter}');
}

function feedback() {
  submitMessage('Hello');
  cy.get('.negative-feedback-off').should('have.length', 1);
  cy.get('.positive-feedback-off').should('have.length', 1).click();
  cy.get('#feedbackSubmit').click();
  cy.get('.positive-feedback-on').should('have.length', 1);
}

function threadQueue() {
  cy.get('.step').eq(1).should('contain', 'Create step counter: 0');
  cy.get('.step').eq(3).should('contain', 'Create step counter: 3');
  cy.get('.step').eq(6).should('contain', 'Create step counter: 6');
}

function threadList() {
  cy.get('#thread-test1').should('contain', 'Thread 1');
  cy.get('#thread-test2').should('contain', 'Thread 2');

  // Test thread page
  cy.get('#thread-test1').click();
  cy.get('#thread-info').should('exist');
  cy.get('.step').should('have.length', 2);
  cy.get('.step').eq(0).should('contain', 'Message 1');
  cy.get('.step').eq(1).should('contain', 'Message 2');

  // Test thread delete
  cy.get('#thread-test1').find("[data-testid='DeleteOutlineIcon']").click();
  cy.get("[type='button']").contains('Confirm').click();
  cy.get('#thread-test1').should('not.exist');
}

function resumeThread() {
  cy.get('#thread-test2').click();
  cy.get(`#chat-input`).should('not.exist');
  cy.get('#resumeThread').click();
  cy.get(`#chat-input`).should('exist');

  cy.get('.step').should('have.length', 3);

  cy.get('.step').eq(0).should('contain', 'Message 3');
  cy.get('.step').eq(1).should('contain', 'Message 4');
  cy.get('.step').eq(2).should('contain', 'Welcome back to thread 2');
}

describe('Data Layer', () => {
  before(() => {
    runTestServer();
  });

  describe('Data Features with persistence', () => {
    it('should login, submit feedback, wait for user input to create steps, browse thread history, delete a thread and then resume a thread', () => {
      login();
      feedback();
      threadQueue();
      threadList();
      resumeThread();
    });
  });
});
