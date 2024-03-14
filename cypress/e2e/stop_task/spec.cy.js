'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
(0, testUtils_1.describeSyncAsync)('Stop task', function (mode) {
  before(function () {
    (0, testUtils_1.runTestServer)(mode);
  });
  it('should be able to stop a task', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').last().should('contain.text', 'Message 1');
    cy.get('#stop-button').should('exist').click();
    cy.get('#stop-button').should('not.exist');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').last().should('contain.text', 'Task stopped by the user.');
    cy.wait(5000);
    cy.get('.step').should('have.length', 2);
    (0, testUtils_1.submitMessage)('Hello');
    cy.get('.step').should('have.length', 4);
    cy.get('.step').last().should('contain.text', 'World');
  });
});
