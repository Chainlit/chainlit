'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Copilot', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
    cy.document().then(function (document) {
      document.body.innerHTML = '<div id="root"><h1>Copilot test!</h1></div>';
      var script = document.createElement('script');
      script.src = 'http://localhost:8000/copilot/index.js';
      document.body.appendChild(script);
    });
    // Wait for the script to load and execute the initialization
    cy.window().then(function (win) {
      cy.wait(1000).then(function () {
        // @ts-expect-error is not a valid prop
        win.mountChainlitWidget({
          chainlitServer: 'http://localhost:8000'
        });
        win.addEventListener('chainlit-call-fn', function (e) {
          // @ts-expect-error is not a valid prop
          var _a = e.detail,
            name = _a.name,
            args = _a.args,
            callback = _a.callback;
          if (name === 'test') {
            callback('Function called with: ' + args.msg);
          }
        });
      });
    });
  });
  it('should be able to embed the copilot', function () {
    cy.get('#chainlit-copilot-button').should('be.visible').click();
    cy.get('#chainlit-copilot-popover').should('be.visible');
    cy.get('#chainlit-copilot-popover').within(function () {
      cy.get('.step').should('have.length', 1);
      cy.contains('.step', 'Hi from copilot!').should('be.visible');
    });
    (0, testUtils_1.submitMessageCopilot)('Call func!');
    cy.get('#chainlit-copilot-popover').within(function () {
      cy.get('.step').should('have.length', 3);
      cy.contains('.step', 'Function called with: Call func!').should(
        'be.visible'
      );
    });
  });
});
