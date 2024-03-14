'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
(0, testUtils_1.describeSyncAsync)('Step', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to nest steps', function () {
    (0, testUtils_1.submitMessage)('Hello');
    cy.get('#tool-1-loading').should('exist');
    cy.get('#tool-1-loading').click();
    cy.get('#tool_2-loading').should('exist');
    cy.get('#tool_2-loading').click();
    cy.get('#tool-3-loading').should('exist');
    cy.get('#tool-3-loading').click();
    cy.get('#tool-1-done').should('exist');
    cy.get('#tool_2-done').should('exist');
    cy.get('#tool-3-done').should('exist');
    cy.get('.step').should('have.length', 5);
  });
});
