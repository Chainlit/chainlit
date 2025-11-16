import {
  copilotShouldBeOpen,
  clearCopilotThreadId,
  getCopilotThreadId,
  loadCopilotScript,
  mountCopilotWidget,
  openCopilot,
  submitMessage,
} from '../../support/testUtils';

describe('Copilot', { includeShadowDom: true }, () => {
  beforeEach(() => {
    loadCopilotScript();
  });

  it('should be able to embed the copilot', () => {
    cy.get('#chainlit-copilot').should('not.exist');
    mountCopilotWidget();
    cy.get('#chainlit-copilot').should('exist');
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

    openCopilot();

    cy.get('.step').should('have.length', 1);
    cy.contains('.step', 'Hi from copilot!').should('be.visible');

    cy.step('Start conversation');

    submitMessage('Call func!');
    cy.get('.step').should('have.length', 5);
    cy.contains('.step', 'Function called with: Call func!').should(
      'be.visible'
    );
    cy.contains('.step', 'System message received: Hello World!').should(
      'be.visible'
    );
  });

  it('should persist thread', () => {
    mountCopilotWidget();
    cy.step('Check persistance availability');

    cy.window().should('have.property', 'getChainlitCopilotThreadId');
    cy.window().should('have.property', 'clearChainlitCopilotThreadId');

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.equal(null);
    });

    openCopilot();

    let firstThreadId: string;
    getCopilotThreadId().then((threadId) => {
      firstThreadId = threadId;
      expect(firstThreadId).to.not.equal(null);
    });

    cy.step('Start conversation');

    submitMessage('Hello Copilot!');

    cy.get('.step').should('have.length', 2);
    cy.contains('.step', 'Hi from copilot!').should('be.visible');
    cy.contains('.step', 'Hello Copilot!').should('be.visible');

    cy.step('Start new thread programmatically');

    clearCopilotThreadId();

    cy.wait(1000); // Wait for the thread ID to be cleared

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.not.equal(null);
      expect(threadId).to.not.equal(firstThreadId);
    });

    cy.get('.step').should('have.length', 1);

    cy.step('Start conversation');

    submitMessage('Hello Copilot from a new thread!');
    cy.get('.step').should('have.length', 2);
    cy.contains('.step', 'Hi from copilot!').should('be.visible');
    cy.contains('.step', 'Hello Copilot from a new thread!').should(
      'be.visible'
    );

    cy.step('Start new thread programmatially with predefined ID');

    const newThreadId = crypto.randomUUID();
    clearCopilotThreadId(newThreadId);

    cy.wait(1000); // Wait for the thread ID to be cleared

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.equal(newThreadId);
    });

    cy.get('.step').should('have.length', 1);
    cy.contains('.step', 'Hi from copilot!').should('be.visible');

    cy.step('Start new thread from UI');

    cy.get('#new-chat-button').click();
    cy.get('#new-chat-dialog').should('exist');
    cy.get('#new-chat-dialog').within(() => {
      cy.get('#confirm').click();
    });

    cy.wait(1000); // Wait for the new chat to be created

    getCopilotThreadId().then((threadId) => {
      expect(threadId).to.not.equal(null);
      expect(threadId).to.not.equal(newThreadId);
    });
  });

  describe('Language from config', () => {
    const testData = [
      {
        language: 'en-US',
        placeholder: 'Type your message here...'
      },
      {
        language: 'fr-FR',
        placeholder: 'Tapez votre message ici...'
      }
    ];

    testData.forEach(({ language, placeholder }) => {
      it(`should support ${language}`, () => {
        mountCopilotWidget({
          language
        });
        openCopilot();

        cy.step('Check input placeholder');
        cy.get('#chat-input').should(
          'have.attr',
          'placeholder',
          placeholder
        );
      });
    });
  });

  it('should be opened if config.opened is true', () => {
    mountCopilotWidget({
      opened: true
    });

    copilotShouldBeOpen();
  });
});
