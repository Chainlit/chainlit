import { runTestServer, submitMessage } from '../../support/testUtils';

describe('tasklist', () => {
  before(() => {
    runTestServer();
  });

  it('should display the tasklist ', () => {
    cy.get('.step').should('have.length', 0);
    cy.get('.tasklist').should('have.length', 1);
    cy.get('.tasklist.tasklist-mobile').should('not.exist');

    cy.get('.tasklist').should('be.visible');
    cy.get('.tasklist .task').should('have.length', 17);

    cy.get('.tasklist .task.task-status-ready').should(
      'have.length',
      7
    );
    cy.get('.tasklist .task.task-status-running').should(
      'have.length',
      0
    );
    cy.get('.tasklist .task.task-status-failed').should(
      'have.length',
      1
    );
    cy.get('.tasklist .task.task-status-done').should(
      'have.length',
      9
    );

    submitMessage('ok');

    cy.get('.tasklist').should('not.exist');
  });
});
