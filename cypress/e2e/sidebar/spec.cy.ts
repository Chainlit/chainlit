import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Elements', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to open the sidebar from python', () => {
    cy.get('#side-view-content').find('.inline-image').should('have.length', 1);
    cy.get('#side-view-content').find('.inline-pdf').should('have.length', 1);
    cy.get('#side-view-content').find('.inline-text').should('have.length', 2);

    cy.get('#side-view-title').should("have.text", "Test title")

    submitMessage('Hello');

    cy.get('#side-view-content').find('.inline-text').should('have.length', 1).should("have.text", "Text changed!");
    cy.get('#side-view-content').find('.inline-image').should('have.length', 0);
    cy.get('#side-view-content').find('.inline-pdf').should('have.length', 0);

    cy.get('#side-view-title').should("have.text", "Title changed!")

    cy.get('#side-view-content').should("not.exist")

  });
});
