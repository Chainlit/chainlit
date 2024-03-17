import { runTestServer } from '../../support/testUtils';

describe('Post auth', () => {
  before(() => {
    runTestServer();
  });

  it('should fail to auth without request token', () => {
    cy.get('.MuiAlert-message').should('exist');
  });

  it('should be able to auth with request token', () => {
    cy.intercept('*', (req) => {
      req.body = '{"token": "sometoken"}';
    });
    cy.visit('/');
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');

    cy.reload();
    cy.get('.step').eq(0).should('contain', 'Hello admin');
  });
});
