import { runTestServer } from '../../support/testUtils';

describe('Header auth', () => {
  before(() => {
    runTestServer();
  });

  beforeEach(() => {
    cy.visit('/');
  });

  describe('without an authorization header', () => {
    it('should display an alert message', () => {
      cy.get('.alert').should('exist');
    });
  });

  describe('with authorization header set', () => {
    const setupInterceptors = () => {
      cy.intercept('/auth/header', (req) => {
        req.headers['test-header'] = 'test header value';
        req.continue();
      }).as('auth');

      // Only intercept /user _after_ we're logged in.
      cy.wait('@auth').then(() => {
        cy.intercept('GET', '/user').as('user');
      });
    };

    beforeEach(() => {
      setupInterceptors();
    });

    const shouldBeLoggedIn = () => {
      it('should have an access_token cookie in /auth/header response', () => {
        cy.wait('@auth').then((interception) => {
          expect(interception.response.statusCode).to.equal(200);

          // Response contains `Authorization` cookie, starting with Bearer
          expect(interception.response.headers).to.have.property('set-cookie');
          const cookie = interception.response.headers['set-cookie'][0];
          expect(cookie).to.contain('access_token');
        });
      });

      it('should not display an alert message', () => {
        cy.get('.alert').should('not.exist');
      });

      it("should display 'Hello admin'", () => {
        cy.get('.step').eq(0).should('contain', 'Hello admin');
      });
    };

    shouldBeLoggedIn();

    it('should request and have access to /user', () => {
      cy.wait('@user').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
      });
    });

    describe('after reloading', () => {
      beforeEach(() => {
        cy.reload();
      });

      shouldBeLoggedIn();
    });
  });
});
