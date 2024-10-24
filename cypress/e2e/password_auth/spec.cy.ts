import { runTestServer } from '../../support/testUtils';

describe('Password Auth', () => {
  before(() => {
    runTestServer();
  });

  it('should fail to login with wrong credentials', () => {
    cy.get("input[name='email']").type('user');
    cy.get("input[name='password']").type('user');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('exist');
  });

  describe('With correct credentials', () => {
    before(() => {
      cy.visit('/');
      cy.get("input[name='email']").type('admin');
      cy.get("input[name='password']").type('admin');
      cy.get("button[type='submit']").click();
    });

    it('should display expected elements', () => {
      cy.get('.step').eq(0).should('contain', 'Hello admin');

      const text_element_message = cy
        .get('.step')
        .eq(1)
        .find('.message-content');
      text_element_message.should('have.length', 2);

      // First child contains "Check out this text element!"
      text_element_message
        .eq(0)
        .should('contain', 'Check out this text element!');

      // Second child contains "simple_text" as well as "Check out this text element!"
      text_element_message.eq(1).should('contain', 'simple_text');
      text_element_message
        .eq(1)
        .should('contain', 'Hello, this is a text element.');
    });

    it('should not display the login dialog after reloading', () => {
      cy.reload();
      cy.get("input[name='email']").should('not.exist');
      cy.get('.step').eq(0).should('contain', 'Hello admin');
    });
  });
});
