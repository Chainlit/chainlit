import { runTestServer } from '../../support/testUtils';

describe('Auth Custom client', () => {
  before(() => {
    runTestServer();
  });

  it('should fail to login with wrong credentials', () => {
    cy.get("input[name='email']").type('user');
    cy.get("input[name='password']").type('user');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('exist');
  });

  it('should be able to login with correct credentials', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('.message').eq(0).should('contain', 'Hello');
  });
});
