import {
  clearCopilotThreadId,
  copilotShouldBeOpen,
  getCopilotThreadId,
  loadCopilotScript,
  mountCopilotWidget,
  openCopilot,
  submitMessage
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
        cy.get('#chat-input').should('have.attr', 'placeholder', placeholder);
      });
    });
  });

  it('should be opened if config.opened is true', () => {
    mountCopilotWidget({
      opened: true
    });

    copilotShouldBeOpen();
  });

  describe('Sidebar mode', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.removeItem('chainlit-copilot-displayMode');
        win.localStorage.removeItem('chainlit-copilot-sidebarWidth');
      });
    });

    it('should open as sidebar and push body content', () => {
      mountCopilotWidget({ displayMode: 'sidebar' });

      cy.step('Open sidebar');
      cy.get('#chainlit-copilot-button').click();

      cy.get('#chainlit-copilot-chat').should('exist');
      cy.document().then((doc) => {
        expect(doc.body.style.marginRight).to.equal('400px');
      });
    });

    it('should close sidebar and restore body margin', () => {
      mountCopilotWidget({ displayMode: 'sidebar', opened: true });

      cy.get('#chainlit-copilot-chat').should('exist');

      cy.step('Close sidebar via close button');
      cy.get('#close-sidebar-button').click();

      cy.get('#chainlit-copilot-chat').should('not.exist');
      cy.document().then((doc) => {
        expect(doc.body.style.marginRight).to.not.equal('400px');
      });
    });

    it('should resize sidebar via drag handle', () => {
      mountCopilotWidget({ displayMode: 'sidebar', opened: true });

      cy.get('#chainlit-copilot-chat').should('exist');

      cy.step('Get initial sidebar width');
      cy.get('#chainlit-copilot-chat')
        .parents('div.fixed')
        .first()
        .invoke('width')
        .then((initialWidth) => {
          expect(initialWidth).to.be.closeTo(400, 5);

          cy.step('Drag handle to resize');
          cy.get('[data-testid="sidebar-drag-handle"]').then(($handle) => {
            const handleRect = $handle[0].getBoundingClientRect();
            const startX = handleRect.left + handleRect.width / 2;
            const startY = handleRect.top + handleRect.height / 2;
            const targetX = startX - 200;

            cy.wrap($handle)
              .trigger('mousedown', { clientX: startX, clientY: startY })
              .then(() => {
                cy.document().trigger('mousemove', {
                  clientX: targetX,
                  clientY: startY
                });
                cy.document().trigger('mouseup');
              });
          });

          cy.step('Verify sidebar width changed');
          cy.get('#chainlit-copilot-chat')
            .parents('div.fixed')
            .first()
            .invoke('width')
            .should('be.greaterThan', initialWidth!);

          cy.step('Verify body margin matches new width');
          cy.get('#chainlit-copilot-chat')
            .parents('div.fixed')
            .first()
            .invoke('width')
            .then((newWidth) => {
              cy.document().then((doc) => {
                const margin = parseFloat(doc.body.style.marginRight);
                expect(margin).to.be.closeTo(newWidth!, 2);
              });
            });
        });
    });

    it('should switch from sidebar to floating mode', () => {
      mountCopilotWidget({ displayMode: 'sidebar', opened: true });

      cy.get('#chainlit-copilot-chat').should('exist');

      cy.step('Switch to floating mode via dropdown');
      cy.get('#display-mode-button').click();

      cy.contains('[role="menuitemradio"]', 'Floating').click();

      cy.document().then((doc) => {
        expect(doc.body.style.marginRight).to.not.equal('400px');
      });
    });

    it('should restore body margin on widget unmount', () => {
      cy.step('Set a custom body margin before mounting');
      cy.document().then((doc) => {
        doc.body.style.marginRight = '20px';
      });

      mountCopilotWidget({ displayMode: 'sidebar', opened: true });

      cy.get('#chainlit-copilot-chat').should('exist');
      cy.document().then((doc) => {
        expect(doc.body.style.marginRight).to.equal('400px');
      });

      cy.step('Unmount widget and verify margin is restored');
      cy.window().then((win) => {
        // @ts-expect-error is not a valid prop
        win.unmountChainlitWidget();
      });

      cy.document().then((doc) => {
        expect(doc.body.style.marginRight).to.equal('20px');
      });
    });

    it('should persist sidebar width across remounts', () => {
      cy.step('Pre-set a custom width in localStorage');
      cy.window().then((win) => {
        win.localStorage.setItem('chainlit-copilot-sidebarWidth', '500');
      });

      mountCopilotWidget({ displayMode: 'sidebar', opened: true });

      cy.step('Verify sidebar uses the persisted width');
      cy.get('#chainlit-copilot-chat')
        .parents('div.fixed')
        .first()
        .invoke('width')
        .should('be.closeTo', 500, 5);

      cy.step('Verify body margin matches persisted width');
      cy.document().then((doc) => {
        const margin = parseFloat(doc.body.style.marginRight);
        expect(margin).to.be.closeTo(500, 2);
      });
    });
  });
});
