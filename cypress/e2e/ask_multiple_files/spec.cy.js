'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Upload multiple files', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to receive two files', function () {
    cy.get('#ask-upload-button').should('exist');
    cy.fixture('state_of_the_union.txt', 'utf-8').as('txtFile');
    cy.fixture('hello.py', 'utf-8').as('pyFile');
    cy.get('#ask-button-input').selectFile(['@txtFile', '@pyFile'], {
      force: true
    });
    // Sometimes the loading indicator is not shown because the file upload is too fast
    // cy.get("#ask-upload-button-loading").should("exist");
    // cy.get("#ask-upload-button-loading").should("not.exist");
    cy.get('.step')
      .eq(1)
      .should('contain', '2 files uploaded: state_of_the_union.txt,hello.py');
    cy.get('#ask-upload-button').should('not.exist');
  });
});
