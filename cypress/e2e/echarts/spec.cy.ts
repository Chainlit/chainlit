import { runTestServer } from '../../support/testUtils';

describe('echarts', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display an inline chart', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.echarts-for-react').should('have.length', 1);
  });
});
