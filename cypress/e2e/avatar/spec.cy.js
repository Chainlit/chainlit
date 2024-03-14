'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Avatar', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display avatars', function () {
    cy.get('.step').should('have.length', 5);
    cy.get('.step').eq(0).find('img').should('have.length', 0);
    cy.get('.step').eq(1).find('img').should('have.length', 1);
    cy.get('.step').eq(2).find('img').should('have.length', 0);
    cy.get('.step').eq(3).find('img').should('have.length', 1);
    cy.get('.step').eq(4).find('img').should('have.length', 1);
    cy.get('.element-link').should('have.length', 0);
  });
});
