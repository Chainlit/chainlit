import { submitMessage } from '../../support/testUtils';

describe('Element Sidebar', () => {
  it('should be able to interact with the element sidebar', () => {
    // Check initial state
    cy.get('#side-view-title').should('have.text', 'Test title');
    cy.get('#side-view-content').find('.inline-image').should('have.length', 1);
    cy.get('#side-view-content').find('.inline-pdf').should('have.length', 1);
    cy.get('#side-view-content').find('.inline-text').should('have.length', 2);
    cy.get('#side-view-content .inline-text')
      .first()
      .should('have.text', 'Here is a side text document');
    cy.get('#side-view-content .inline-text')
      .eq(1)
      .should('have.text', 'Here is a page text document');

    // Send a message to trigger updates
    submitMessage('Update sidebar');

    // Check updated state
    cy.get('#side-view-title').should('have.text', 'Title changed!');
    cy.get('#side-view-content').find('.inline-image').should('have.length', 0);
    cy.get('#side-view-content').find('.inline-pdf').should('have.length', 0);
    cy.get('#side-view-content').find('.inline-text').should('have.length', 1);
    cy.get('#side-view-content .inline-text')
      .first()
      .should('have.text', 'Text changed!');

    // Sidebar closes after a delay; wait until it is gone
    cy.get('#side-view-content', { timeout: 10000 }).should('not.exist');
    cy.get('#side-view-title', { timeout: 10000 }).should('not.exist');
  });
});
