'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Update Step', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to update a step', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('#chatbot-loading').should('exist').click();
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).should('contain', 'Hello!');
    cy.get('.step').eq(1).should('contain', 'Foo');
    cy.get('.step').eq(0).should('contain', 'Hello again!');
    cy.get('.step').eq(1).should('contain', 'Foo Bar');
  });
});
