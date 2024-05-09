import { runTestServer, submitMessage } from '../../support/testUtils';

function newSession() {
  cy.get('#header')
    .get('#new-chat-button')
    .should('exist')
    .click({ force: true });
  cy.get('#new-chat-dialog').should('exist');
  cy.get('#confirm').should('exist').click();

  cy.get('#new-chat-dialog').should('not.exist');
}

describe('User Session', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to store data related per user session', () => {
    submitMessage('Hello 1');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Prev message: None');

    submitMessage('Hello 2');

    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Prev message: Hello 1');

    newSession();

    submitMessage('Hello 3');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Prev message: None');

    submitMessage('Hello 4');

    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Prev message: Hello 3');
  });
});
