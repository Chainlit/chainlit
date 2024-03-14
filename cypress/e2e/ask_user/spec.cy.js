'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Ask User', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should send a new message containing the user input', function () {
    cy.get('.step').should('have.length', 1);
    (0, testUtils_1.submitMessage)('Jeeves');
    cy.wait(2000);
    cy.get('.step').should('have.length', 3);
    cy.get('.step').eq(2).should('contain', 'Jeeves');
  });
});
