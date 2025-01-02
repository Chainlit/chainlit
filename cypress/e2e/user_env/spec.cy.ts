import { runTestServer, submitMessage } from '../../support/testUtils';

describe('User Env', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to ask a user for required keys', () => {
    const key = 'TEST_KEY';
    const keyValue = 'TEST_VALUE';

    cy.get(`#${key}`).should('exist').type(keyValue);

    cy.get('#submit-env').should('exist').click();

    submitMessage('Hello');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', keyValue);
  });
});
