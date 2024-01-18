import { runTestServer } from '../../support/testUtils';

describe('Copilot', () => {
  before(() => {
    runTestServer();
    cy.document().then((document) => {
      const script = document.createElement('script');
      script.src = 'http://localhost:8000/copilot/index.js';
      document.head.appendChild(script);
    });

    // Wait for the script to load and execute the initialization
    cy.window().then((win) => {
      cy.wait(1000).then(() => {
        // @ts-expect-error is not a valid prop
        win.mountChainlitWidget({
          chainlitServer: 'http://localhost:8000',
          fontFamily: 'Arial'
        });
      });
    });
  });

  it('should be able to display avatars', () => {
    cy.get('#chainlit-copilot-button').should('be.visible').click();
    cy.get('#chainlit-copilot-popover').should('be.visible');

    cy.wait(1000);

    cy.get('#chainlit-copilot-popover').within(() => {
      cy.get('.step').should('have.length', 1);
      cy.contains('.step', 'Hi copilot!').should('be.visible');
    });
  });
});
