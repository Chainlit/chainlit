import { runTestServer } from '../../support/testUtils';

describe('Action', () => {
  before(() => {
    runTestServer();
  });

  it('should correctly execute and display actions', () => {
    // Click on "first action"
    cy.get('#first-action').should('exist');
    cy.get('#first-action').click();
    cy.get('.step').should('have.length', 3);
    cy.get('.step')
      .eq(2)
      .should('contain', 'Thanks for pressing: first-action');

    // Click on "test action"
    cy.get("[id='test-action']").should('exist');
    cy.get("[id='test-action']").click();
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Executed test action!');
    cy.get("[id='test-action']").should('exist');

    // Click on "removable action"
    cy.get("[id='removable-action']").should('exist');
    cy.get("[id='removable-action']").click();
    cy.get('.step').should('have.length', 5);
    cy.get('.step').eq(4).should('contain', 'Executed removable action!');
    cy.get("[id='removable-action']").should('not.exist');

    cy.get('.step').should('have.length', 5);

    cy.get("[id='multiple-action-one']").should('exist');
    cy.get("[id='multiple-action-one']").click();
    cy.get('.step')
      .eq(5)
      .should('contain', 'Action(id=multiple-action-one) has been removed!');
    cy.get("[id='multiple-action-one']").should('not.exist');

    // Click on "multiple action two", should remove the correct action button
    cy.get('.step').should('have.length', 6);
    cy.get("[id='multiple-action-two']").click();
    cy.get('.step')
      .eq(6)
      .should('contain', 'Action(id=multiple-action-two) has been removed!');
    cy.get("[id='multiple-action-two']").should('not.exist');

    // Click on "all actions removed", should remove all buttons
    cy.get("[id='all-actions-removed']").should('exist');
    cy.get("[id='all-actions-removed']").click();
    cy.get('.step').eq(7).should('contain', 'All actions have been removed!');
    cy.get("[id='all-actions-removed']").should('not.exist');
    cy.get("[id='test-action']").should('not.exist');
  });
});
