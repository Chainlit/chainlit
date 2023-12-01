import { runTestServer } from '../../support/testUtils';

describe('DisablePromptPlayground', () => {
  before(() => {
    runTestServer();
  });

  it('should not display the playground button', () => {
    cy.wait(2000);
    cy.get('.playground-button').should('not.exist');
  });
});
