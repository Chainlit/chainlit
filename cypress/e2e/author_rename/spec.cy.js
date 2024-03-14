'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Author rename', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to rename authors', function () {
    cy.get('.step').eq(0).should('contain', 'Albert Einstein');
    cy.get('.step').eq(1).should('contain', 'Assistant');
  });
});
