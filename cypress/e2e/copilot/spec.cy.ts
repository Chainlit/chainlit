import { runTestServer, submitMessageCopilot } from '../../support/testUtils';

describe('Copilot', () => {
  before(() => {
    runTestServer();
    cy.document().then((document) => {
      document.body.innerHTML = '<div id="root"><h1>Copilot test!</h1></div>';
      const script = document.createElement('script');
      script.src = 'http://localhost:8000/copilot/index.js';
      document.body.appendChild(script);
    });

    // Wait for the script to load and execute the initialization
    cy.window().then((win) => {
      cy.wait(1000).then(() => {
        // @ts-expect-error is not a valid prop
        win.mountChainlitWidget({
          chainlitServer: 'http://localhost:8000'
        });

        win.addEventListener('chainlit-call-fn', (e) => {
          // @ts-expect-error is not a valid prop
          const { name, args, callback } = e.detail;
          if (name === 'test') {
            callback('Function called with: ' + args.msg);
          }
        });
      });
    });
  });

  it('should be able to embed the copilot', () => {
    cy.get('#chainlit-copilot-button').should('be.visible').click();
    cy.get('#chainlit-copilot-popover').should('be.visible');

    cy.get('#chainlit-copilot-popover').within(() => {
      cy.get('.step').should('have.length', 1);
      cy.contains('.step', 'Hi from copilot!').should('be.visible');
    });

    submitMessageCopilot('Call func!');
    cy.get('#chainlit-copilot-popover').within(() => {
      cy.get('.step').should('have.length', 3);
      cy.contains('.step', 'Function called with: Call func!').should(
        'be.visible'
      );
    });
  });
});
