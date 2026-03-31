import { setupWebSocketListener } from '../../support/testUtils';

describe('Custom Element Auth', () => {
  it('should not allow arbitrary file read', () => {
    let chainlitKey: string | null = null;
    let sessionId: string | null = null;

    setupWebSocketListener('element', (data) => {
      chainlitKey = data.chainlitKey;
    });

    cy.intercept('POST', '/login').as('login');
    cy.intercept('POST', '/set-session-cookie').as('setSession');

    cy.get('input[name="email"]').type('admin');
    cy.get('input[name="password"]').type('admin');
    cy.get('button[type="submit"]').click();

    cy.get('.step').should('have.length', 1);

    cy.wait('@setSession').then((interception) => {
      sessionId = interception.request.body.session_id;
    });

    cy.wrap(null).should(() => {
      expect(sessionId).to.not.equal(null);
    });

    cy.then(() => {
      cy.request({
        method: 'PUT',
        url: '/project/element',
        body: {
          element: {
            type: 'custom',
            id: 'test',
            name: 'test',
            display: 'inline',
            path: 'cypress/e2e/custom_element_auth/test.txt'
          },
          sessionId: sessionId
        }
      });
    });

    cy.wrap(null).should(() => {
      expect(chainlitKey).to.not.equal(null);
    });

    cy.then(() => {
      cy.request({
        method: 'GET',
        url: `/project/file/${chainlitKey}`,
        qs: { session_id: sessionId }
      }).then((response) => {
        expect(response.body).to.not.equal('Test');
      });
    });
  });
});
