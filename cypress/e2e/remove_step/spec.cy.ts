import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Remove Step', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to remove a step', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 1');

    cy.get('#step-tool1').should('exist');
    cy.get('#step-tool1').click();
    cy.get('.message-content').eq(1).should('contain', 'Child 1');

    cy.get('#step-tool1').should('not.exist');

    cy.get('.step').eq(1).should('contain', 'Message 2');
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 2');
    cy.get('.step').should('have.length', 0);

    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Message 3');

    submitMessage('foo');

    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'foo');
  });
});
