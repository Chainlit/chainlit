import { runTestServer } from '../../support/testUtils';

describe('Elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display inlined, side and page elements', () => {
    cy.get('.step').eq(0).find('.inline-image').should('have.length', 0);
    cy.get('.step').eq(0).find('.element-link').should('have.length', 0);
    cy.get('.step').eq(0).find('.inline-pdf').should('have.length', 0);

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
    const sideViewTitle = cy.get('#side-view-title');
    sideViewTitle.should('exist');
    sideViewTitle.should('contain', 'text1');

    const sideViewContent = cy.get('#side-view-content');
    sideViewContent.should('exist');
    sideViewContent.should('contain', 'Here is a side text document');

    // Page
    cy.get('.step')
      .eq(2)
      .find('.element-link')
      .eq(1)
      .should('contain', 'text2')
      .click();

    const view = cy.get('#element-view');
    view.should('exist');
    view.should('contain', 'text2');
    view.should('contain', 'Here is a page text document');
  });
});
