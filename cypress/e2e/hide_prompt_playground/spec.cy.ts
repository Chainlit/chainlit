import { runTestServer } from '../../support/testUtils';

describe('HidePromptPlayground', () => {
  before(() => {
    runTestServer();
  });

  describe('Basic template', () => {
    it('should not display the playground button', () => {
      cy.get('.playground-button').should('not.exist');
    });
  });
});
