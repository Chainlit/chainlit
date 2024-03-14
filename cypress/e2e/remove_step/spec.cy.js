'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Remove Step', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to remove a step', function () {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 1');
    cy.get('#chatbot-loading').should('exist');
    cy.get('#chatbot-loading').click();
    cy.get('.step').eq(1).should('contain', 'Child 1');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Message 2');
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 2');
    cy.get('.step').should('have.length', 0);
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 3');
    (0, testUtils_1.submitMessage)('foo');
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'foo');
  });
});
