'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Password Auth', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should fail to login with wrong credentials', function () {
    cy.get("input[name='email']").type('user');
    cy.get("input[name='password']").type('user');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('exist');
  });
  it('should be able to login with correct credentials', function () {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');
    cy.reload();
    cy.get("input[name='email']").should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');
  });
});
