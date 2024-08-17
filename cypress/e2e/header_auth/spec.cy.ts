import { runTestServer } from '../../support/testUtils';

describe('Header auth', () => {
  before(() => {
    runTestServer();
  });

  it('should fail to auth without custom header', () => {
    cy.get('.MuiAlert-message').should('exist');
  });

  it('should be able to auth with custom header and read custom query parameter', () => {
    cy.intercept('*', (req) => {
      req.headers['test-header'] = 'test header value';
    });
    cy.visit('/?q=test+value');
    cy.get('.MuiAlert-message').should('not.exist');
    cy.get('.step').eq(0).should('contain', 'Hello admin');
    cy.get('.step').eq(0).should('contain', 'query param: test value');

    cy.reload();
    cy.get('.step').eq(0).should('contain', 'Hello admin');
    cy.get('.step').eq(0).should('contain', 'query param: test value');
  });
});
