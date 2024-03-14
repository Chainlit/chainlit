'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Input History', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to show the last message in the message history', function () {
    (0, testUtils_1.openHistory)();
    cy.get('.history-item').should('have.length', 0);
    cy.get('#history-empty').should('exist');
    (0, testUtils_1.closeHistory)();
    var timestamp = Date.now().toString();
    (0, testUtils_1.submitMessage)(timestamp);
    (0, testUtils_1.openHistory)();
    cy.get('#history-empty').should('not.exist');
    cy.get('.history-item').should('have.length', 1);
    cy.get('.history-item').eq(0).should('contain', timestamp).click();
    cy.get('.history-item').should('have.length', 0);
    cy.get('#chat-input').should('have.value', timestamp);
  });
});
