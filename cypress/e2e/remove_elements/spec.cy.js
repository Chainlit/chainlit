'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('remove_elements', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to remove elements', function () {
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(1).find('.inline-image').should('have.length', 1);
  });
});
