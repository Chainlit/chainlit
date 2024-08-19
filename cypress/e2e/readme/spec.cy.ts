import { runTestServer } from '../../support/testUtils';

function openReadme() {
  cy.get('#open-sidebar-button').click();
  cy.get('#readme-button').click();
}

describe('readme_language', () => {
  before(() => {
    runTestServer();
  });

  it('should show default markdown on open', () => {
    openReadme();
    cy.contains('Welcome to Chainlit!');
  });

  it('should show Portguese markdown on pt-BR language', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', {
          value: 'pt-BR'
        });
      }
    });
    openReadme();
    cy.contains('Bem-vindo ao Chainlit!');
  });

  it('should fallback to default markdown on Klingon language', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'language', {
          value: 'Klingon'
        });
      }
    });
    openReadme();
    cy.contains('Welcome to Chainlit!');
  });
});
