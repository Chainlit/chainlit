'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Error Handling', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should correctly display errors', function () {
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should('contain', 'This is an error message');
  });
});
