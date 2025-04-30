import { runTestServer } from '../../support/testUtils';

describe('Update Step', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to update a step', () => {
    cy.get(`#step-tool1`).click();
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).should('contain', 'Hello!');
    cy.get(`#step-tool1`).parent().parent().should('contain', 'Foo');

    cy.get('.step').eq(0).should('contain', 'Hello again!');
    cy.get(`#step-tool1`).parent().parent().should('contain', 'Foo Bar');
  });
});
