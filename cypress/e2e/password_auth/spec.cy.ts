import { runTestServer } from '../../support/testUtils';

describe('Password Auth', () => {
  before(() => {
    runTestServer();
  });

  describe('when unauthenticated', () => {
    describe('visiting /', () => {
      beforeEach(() => {
        cy.intercept('GET', '/user').as('user');
        cy.visit('/');
      });

      it('should attempt to and not not have permission to access /user', () => {
        cy.wait('@user').then((interception) => {
          expect(interception.response.statusCode).to.equal(401);
        });
      });

      it('should redirect to login dialog', () => {
        cy.location('pathname').should('eq', '/login');
        cy.get("input[name='email']").should('exist');
        cy.get("input[name='password']").should('exist');
      });
    });

    describe('visiting /login', () => {
      beforeEach(() => {
        cy.visit('/login');
      });

      describe('submitting incorrect credentials', () => {
        it('should fail to login with wrong credentials', () => {
          cy.get("input[name='email']").type('user');
          cy.get("input[name='password']").type('user');
          cy.get("button[type='submit']").click();
          cy.get('body').should('contain', 'Unauthorized');
        });
      });

      describe('submitting correct credentials', () => {
        beforeEach(() => {
          cy.get("input[name='email']").type('admin');
          cy.get("input[name='password']").type('admin');

          cy.intercept('POST', '/login').as('login');
          cy.intercept('GET', '/user').as('user');
          cy.get("button[type='submit']").click();
        });

        const shouldBeLoggedIn = () => {
          it('should have an access_token cookie in /login response', () => {
            cy.wait('@login').then((interception) => {
              expect(interception.response.statusCode).to.equal(200);

              // Response contains `Authorization` cookie, starting with Bearer
              expect(interception.response.headers).to.have.property(
                'set-cookie'
              );
              const cookie = interception.response.headers['set-cookie'][0];
              expect(cookie).to.contain('access_token');
            });
          });

          it('should request and have access to /user', () => {
            cy.wait('@user').then((interception) => {
              expect(interception.response.statusCode).to.equal(200);
            });
          });

          it('should not be on /login', () => {
            cy.location('pathname').should('not.contain', '/login');
          });

          it('should not contain a login form', () => {
            cy.get("input[name='email']").should('not.exist');
            cy.get("input[name='password']").should('not.exist');
          });

          it('should show "Hello admin"', () => {
            cy.get('.step').eq(0).should('contain', 'Hello admin');
          });
        };

        shouldBeLoggedIn();

        describe('after reloading', () => {
          beforeEach(() => {
            cy.reload();
          });

          shouldBeLoggedIn();
        });
      });
    });
  });
});
