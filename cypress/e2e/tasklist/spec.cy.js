'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('tasklist', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should display the tasklist ', function () {
    cy.get('.step').should('have.length', 0);
    cy.get('.tasklist').should('have.length', 2);
    cy.get('.tasklist.tasklist-mobile').should('not.be.visible');
    cy.get('.tasklist.tasklist-mobile .task').should('not.be.visible');
    cy.get('.tasklist.tasklist-desktop').should('be.visible');
    cy.get('.tasklist.tasklist-desktop .task').should('have.length', 17);
    cy.get('.tasklist.tasklist-desktop .task.task-status-ready').should(
      'have.length',
      7
    );
    cy.get('.tasklist.tasklist-desktop .task.task-status-running').should(
      'have.length',
      0
    );
    cy.get('.tasklist.tasklist-desktop .task.task-status-failed').should(
      'have.length',
      1
    );
    cy.get('.tasklist.tasklist-desktop .task.task-status-done').should(
      'have.length',
      9
    );
    (0, testUtils_1.submitMessage)('ok');
    cy.get('.tasklist').should('not.exist');
  });
});
