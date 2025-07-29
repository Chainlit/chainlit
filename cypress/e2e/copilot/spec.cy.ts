import {
  clearCopilotThreadId,
  getCopilotThreadId,
  runTestServer,
  submitMessageCopilot
} from '../../support/testUtils';

describe('Copilot', () => {
  const opts = { includeShadowDom: true };

  before(() => {
    runTestServer();
  });

  beforeEach(() => {
    cy.visit('/');
    cy.document().then((document) => {
      document.body.innerHTML = '<div id="root"><h1>Copilot test!</h1></div>';

      return new Cypress.Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${document.location.origin}/copilot/index.js`;
        script.onload = resolve;
        script.onerror = () =>
          reject(new Error('Failed to load copilot/index.js'));
        document.body.appendChild(script);
      });
    });

    cy.window().should('have.property', 'mountChainlitWidget');

    // Wait for the script to load and execute the initialization
    cy.window().then((win) => {
      // @ts-expect-error is not a valid prop
      win.mountChainlitWidget({
        chainlitServer: window.location.origin
      });
    });
  });

  it('should be able to embed the copilot', () => {
    cy.window().then((win) => {
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

    cy.get('#chainlit-copilot-button', opts).click();
    cy.get('#chainlit-copilot', opts).should('exist');

    cy.get('.step', opts).should('have.length', 1);
    cy.contains('.step', 'Hi from copilot!', opts).should('be.visible');

    submitMessageCopilot('Call func!');
    cy.get('.step', opts).should('have.length', 5);
    cy.contains('.step', 'Function called with: Call func!', opts).should(
      'be.visible'
    );
    cy.contains('.step', 'System message received: Hello World!', opts).should(
      'be.visible'
    );
  });

  it('should persist thread', () => {
    cy.window().should('have.property', 'getChainlitCopilotThreadId');
    cy.window().should('have.property', 'clearChainlitCopilotThreadId');

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.equal(null);
    });

    cy.get('#chainlit-copilot-button', opts).click();
    cy.get('#chainlit-copilot', opts).should('exist');

    let firstThreadId: string;
    getCopilotThreadId().then((threadId) => {
      firstThreadId = threadId;
      expect(firstThreadId).to.not.equal(null);
    });

    submitMessageCopilot('Hello Copilot!');

    cy.get('.step', opts).should('have.length', 2);
    cy.contains('.step', 'Hi from copilot!', opts).should('be.visible');
    cy.contains('.step', 'Hello Copilot!', opts).should('be.visible');

    clearCopilotThreadId();

    cy.wait(1000); // Wait for the thread ID to be cleared

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.not.equal(null);
      expect(threadId).to.not.equal(firstThreadId);
    });

    cy.get('.step', opts).should('have.length', 1);

    submitMessageCopilot('Hello Copilot from a new thread!');
    cy.get('.step', opts).should('have.length', 2);
    cy.contains('.step', 'Hi from copilot!', opts).should('be.visible');
    cy.contains('.step', 'Hello Copilot from a new thread!', opts).should(
      'be.visible'
    );

    const newThreadId = crypto.randomUUID();
    clearCopilotThreadId(newThreadId);

    cy.wait(1000); // Wait for the thread ID to be cleared

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.equal(newThreadId);
    });

    cy.get('.step', opts).should('have.length', 1);
    cy.contains('.step', 'Hi from copilot!', opts).should('be.visible');

    cy.get('#new-chat-button', opts).click();
    cy.get('#new-chat-dialog', opts).should('exist');
    cy.get('#new-chat-dialog', opts).within(() => {
      cy.get('#confirm').click();
    });

    cy.wait(1000); // Wait for the new chat to be created

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.not.equal(null);
      expect(threadId).to.not.equal(newThreadId);
    });
  });
});
