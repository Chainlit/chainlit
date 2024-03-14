'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Elements', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to display inlined, side and page elements', function () {
    cy.get('.step').eq(0).find('.inline-image').should('have.length', 0);
    cy.get('.step').eq(0).find('.element-link').should('have.length', 0);
    cy.get('.step').eq(0).find('.inline-pdf').should('have.length', 0);
    cy.get('#gen_img-done').should('exist').click();
    cy.get('.step').eq(1).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(2).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(2).find('.element-link').should('have.length', 2);
    cy.get('.step').eq(2).find('.inline-pdf').should('have.length', 1);
    cy.get('.step').eq(3).find('.inline-image').should('have.length', 1);
    cy.get('.step').eq(3).find('.element-link').should('have.length', 2);
    cy.get('.step').eq(3).find('.inline-pdf').should('have.length', 1);
    // Side
    cy.get('.step')
      .eq(2)
      .find('.element-link')
      .eq(0)
      .should('contain', 'text1')
      .click();
    var sideViewTitle = cy.get('#side-view-title');
    sideViewTitle.should('exist');
    sideViewTitle.should('contain', 'text1');
    var sideViewContent = cy.get('#side-view-content');
    sideViewContent.should('exist');
    sideViewContent.should('contain', 'Here is a side text document');
    // Page
    cy.get('.step')
      .eq(2)
      .find('.element-link')
      .eq(1)
      .should('contain', 'text2')
      .click();
    var view = cy.get('#element-view');
    view.should('exist');
    view.should('contain', 'text2');
    view.should('contain', 'Here is a page text document');
  });
});
