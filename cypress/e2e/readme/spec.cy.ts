import { runTestServer } from '../../support/testUtils';

describe('readme_language', () => {
  before(() => {
    runTestServer();
  });

  it('should show default markdown on open', () => {
    cy.visit('/readme');
    cy.contains('Welcome to Chainlit!');
  });

  it('should show Portguese markdown on pt-BR language', () => {
    cy.visit('/readme', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', {
          value: 'pt-BR'
        });
      }
    });
    cy.contains('Bem-vindo ao Chainlit!');
  });

  it('should fallback to default markdown on Klingon language', () => {
    cy.visit('/readme', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', {
          value: 'Klingon'
        });
      }
    });
    cy.contains('Welcome to Chainlit!');
  });
});
