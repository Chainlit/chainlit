'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Chat profiles', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to select a chat profile', function () {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('#chat-input').should('exist');
    cy.get('[data-test="chat-profile:GPT-3.5"]').should('exist');
    cy.get('[data-test="chat-profile:GPT-4"]').should('exist');
    cy.get('[data-test="chat-profile:GPT-5"]').should('exist');
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-3.5 chat profile'
      );
    // Change chat profile
    cy.get('[data-test="chat-profile:GPT-4"]').click();
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );
    cy.get('#new-chat-button').click();
    cy.get('#confirm').click();
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-4 chat profile'
      );
    (0, testUtils_1.submitMessage)('hello');
    cy.get('.step').should('have.length', 2).eq(1).should('contain', 'hello');
    cy.get('[data-test="chat-profile:GPT-5"]').click();
    cy.get('#confirm').click();
    cy.get('.step')
      .should('have.length', 1)
      .eq(0)
      .should(
        'contain',
        'starting chat with admin using the GPT-5 chat profile'
      );
  });
});
