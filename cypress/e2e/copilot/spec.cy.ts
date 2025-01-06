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
          win.sendChainlitMessage({
            type: 'system_message',
            output: 'Hello World!'
          });
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
    const opts = { includeShadowDom: true };
    cy.get('#chainlit-copilot-button', opts).click();
    cy.get('#chainlit-copilot', opts).should('exist');

    cy.get('.step', opts).should('have.length', 1);
    cy.contains('.step', 'Hi from copilot!', opts).should('be.visible');

    submitMessageCopilot('Call func!');
    cy.get('.step', opts).should('have.length', 5);
    cy.contains('.step', 'Function called with: Call func!', opts).should(
      'be.visible'
    );
    cy.contains(
      '.step',
      'System message received: Hello World!',
      opts
    ).should('be.visible');
  });
});
