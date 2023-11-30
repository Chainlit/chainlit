import { runTestServer } from '../../support/testUtils';

describe('Author rename', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to rename authors', () => {
    cy.get('.step').eq(0).should('contain', 'Albert Einstein');
    cy.get('.step').eq(1).should('contain', 'Assistant');
  });
});
