import { runTestServer } from '../../support/testUtils';

const tokenList = ['the', 'quick', 'brown', 'fox'];

function messageStream(index: number) {
  for (const token of tokenList) {
    cy.get('.step').eq(index).should('contain', token);
  }
  cy.get('.step').eq(index).should('contain', tokenList.join(' '));
}

function toolStream(tool: string) {
  const toolCall = cy.get(`#step-${tool}`);
  toolCall.click();
  for (const token of tokenList) {
    toolCall.parent().parent().should('contain', token);
  }
  toolCall.parent().parent().should('contain', tokenList.join(' '));
}

describe('Streaming', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to stream a message', () => {
    cy.get('.step').should('have.length', 1);

    messageStream(0);

    cy.get('.step').should('have.length', 1);

    messageStream(1);

    cy.get('.step').should('have.length', 2);

    toolStream('tool1');

    cy.get('.step').should('have.length', 3);
  });
});
