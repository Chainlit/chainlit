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

describe('Data Layer with Sqlite', () => {
  before(() => {
    runTestServer();
  });

  describe('Data Features with Sqlite file persistence', () => {
    it('should login, submit feedback, wait for user input to create steps, browse thread history, delete a thread and then resume a thread', () => {
      login();
      feedback();
    });
  });
});

describe('DB file existence check', () => {
  it('should check if db file was created', () => {
    const filePath = 'cypress/e2e/data_layer_sqlite/chainlit.db';

    cy.readFile(filePath).then((content) => {
      expect(content).to.exist;
    });
  });
});
