import { runTestServer } from '../../support/testUtils';

describe('Update Step', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to update a step', () => {
    cy.get(`#tool-call-tool1`).click();
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).should('contain', 'Hello!');
    cy.get(`#tool-call-tool1`).parent().should('contain', 'Foo');

    cy.get('.step').eq(0).should('contain', 'Hello again!');
    cy.get(`#tool-call-tool1`).parent().should('contain', 'Foo Bar');
  });
});
