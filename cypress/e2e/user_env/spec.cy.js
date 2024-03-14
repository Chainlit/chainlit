'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('User Env', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to ask a user for required keys', function () {
    var key = 'TEST_KEY';
    var keyValue = 'TEST_VALUE';
    cy.get('#env').should('exist');
    cy.get('.'.concat(key)).should('exist').type(keyValue);
    cy.get('#submit-env').should('exist').click();
    (0, testUtils_1.submitMessage)('Hello');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', keyValue);
  });
});
