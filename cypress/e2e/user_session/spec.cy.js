'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
function newSession() {
  cy.get('#new-chat-button').should('exist').click();
  cy.get('#new-chat-dialog').should('exist');
  cy.get('#confirm').should('exist').click();
  cy.get('#new-chat-dialog').should('not.exist');
}
describe('User Session', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to store data related per user session', function () {
    (0, testUtils_1.submitMessage)('Hello 1');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Prev message: None');
    (0, testUtils_1.submitMessage)('Hello 2');
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Prev message: Hello 1');
    newSession();
    (0, testUtils_1.submitMessage)('Hello 3');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Prev message: None');
    (0, testUtils_1.submitMessage)('Hello 4');
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Prev message: Hello 3');
  });
});
