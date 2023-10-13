import { runTestServer } from '../../support/testUtils';

describe('Action', () => {
  before(() => {
    runTestServer();
  });

  it('should correctly execute and display actions', () => {
    // Click on "first action"
    cy.get('#first-action').should('be.visible');
    cy.get('#first-action').click();
    cy.get('.message').should('have.length', 3);
    cy.get('.message')
      .eq(2)
      .should('contain', 'Thanks for pressing: first-action');

    // Click on "test action"
    cy.get("[id='test-action']").should('be.visible');
    cy.get("[id='test-action']").click();
    cy.get('.message').should('have.length', 4);
    cy.get('.message').eq(3).should('contain', 'Executed test action!');
    cy.get("[id='test-action']").should('exist');

    cy.wait(100);

    // Click on "removable action"
    cy.get("[id='removable-action']").should('be.visible');
    cy.get("[id='removable-action']").click();
    cy.get('.message').should('have.length', 5);
    cy.get('.message').eq(4).should('contain', 'Executed removable action!');
    cy.get("[id='removable-action']").should('not.exist');

    cy.wait(100);

    // Click on "multiple action one" in the action drawer, should remove the correct action button
    cy.get("[id='actions-drawer-button']").should('be.visible');
    cy.get("[id='actions-drawer-button']").click();
    cy.get('.message').should('have.length', 5);

    cy.wait(100);

    cy.get("[id='multiple-action-one']").should('be.visible');
    cy.get("[id='multiple-action-one']").click();
    cy.get('.message')
      .eq(5)
      .should('contain', 'Action(id=multiple-action-one) has been removed!');
    cy.get("[id='multiple-action-one']").should('not.exist');

    cy.wait(100);

    // Click on "multiple action two", should remove the correct action button
    cy.get('.message').should('have.length', 6);
    cy.get("[id='actions-drawer-button']").click();
    cy.get("[id='multiple-action-two']").should('be.visible');
    cy.get("[id='multiple-action-two']").click();
    cy.get('.message')
      .eq(6)
      .should('contain', 'Action(id=multiple-action-two) has been removed!');
    cy.get("[id='multiple-action-two']").should('not.exist');

    cy.wait(100);

    // Click on "all actions removed", should remove all buttons
    cy.get("[id='all-actions-removed']").should('be.visible');
    cy.get("[id='all-actions-removed']").click();
    cy.get('.message')
      .eq(7)
      .should('contain', 'All actions have been removed!');
    cy.get("[id='all-actions-removed']").should('not.exist');
    cy.get("[id='test-action']").should('not.exist');
    cy.get("[id='actions-drawer-button']").should('not.exist');
  });
});
