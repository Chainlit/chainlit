'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('plotly', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display an inline chart', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-plotly').should('have.length', 1);
  });
});
