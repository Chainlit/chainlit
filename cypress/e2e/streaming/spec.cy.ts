import { runTestServer } from '../../support/testUtils';

function testStreamedTest(index: number) {
  const tokenList = ['the', 'quick', 'brown', 'fox'];
  for (const token of tokenList) {
    cy.get('.step').eq(index).should('contain', token);
  }
  cy.get('.step').eq(index).should('contain', tokenList.join(' '));
}

describe('Streaming', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to stream a message', () => {
    cy.get('.step').should('have.length', 1);

    testStreamedTest(0);

    cy.get('.step').should('have.length', 1);

    testStreamedTest(1);

    cy.get('.step').should('have.length', 2);

    testStreamedTest(2);

    cy.get('.step').should('have.length', 3);

    testStreamedTest(3);

    cy.get('.step').should('have.length', 4);
  });
});
