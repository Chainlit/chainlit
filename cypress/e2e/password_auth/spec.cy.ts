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

  it('should be able to login with correct credentials', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('.step').eq(0).should('contain', 'Hello admin');

    cy.reload();
    cy.get("input[name='email']").should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');
  });
});
