'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
function testStreamedTest(index) {
  var tokenList = ['the', 'quick', 'brown', 'fox'];
  for (var _i = 0, tokenList_1 = tokenList; _i < tokenList_1.length; _i++) {
    var token = tokenList_1[_i];
    cy.get('.step').eq(index).should('contain', token);
  }
  cy.get('.step').eq(index).should('contain', tokenList.join(' '));
}
describe('Streaming', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to stream a message', function () {
    cy.get('.step').should('have.length', 1);
    testStreamedTest(0);
    cy.get('.step').should('have.length', 1);
    testStreamedTest(1);
    cy.get('.step').should('have.length', 2);
    testStreamedTest(2);
    cy.get('.step').should('have.length', 3);
    testStreamedTest(3);
    cy.get('.step').should('have.length', 4);
  });
});
