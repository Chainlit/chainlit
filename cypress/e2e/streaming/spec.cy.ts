import { runTestServer } from '../../support/testUtils';

function testStreamedMessage(index: number) {
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

    testStreamedMessage(0);

    cy.get('.step').should('have.length', 1);

    testStreamedMessage(1);

    cy.get('.step').should('have.length', 2);
  });
});
