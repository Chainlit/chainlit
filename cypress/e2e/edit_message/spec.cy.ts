import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Edit Message', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to edit a message', () => {
    submitMessage('Hello 1');
    submitMessage('Hello 2');

    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(3).should('contain', 'Chat context length: 3');

    cy.get('.step').eq(0).trigger('mouseover').find('.edit-message').click({ force: true });
    cy.get('#edit-chat-input').type('Hello 3');
    cy.get('.step').eq(0).find('.confirm-edit').click({ force: true });

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Chat context length: 1');
  });
});
