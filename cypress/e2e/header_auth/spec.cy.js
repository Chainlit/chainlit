'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Header auth', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should fail to auth without custom header', function () {
    cy.get('.MuiAlert-message').should('exist');
  });
  it('should be able to auth with custom header', function () {
    cy.intercept('*', function (req) {
      req.headers['test-header'] = 'test header value';
    });
    cy.visit('/');
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');
    cy.reload();
    cy.get('.step').eq(0).should('contain', 'Hello admin');
  });
});
