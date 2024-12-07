import { runTestServer } from '../../support/testUtils';

describe('Ask Action', () => {
  before(() => {
    runTestServer();
  });

  it('should show the question and the answer selected (Learn Python)', () => {
    cy.contains('button', 'Learn Python').click();
    cy.get('.step').first().should('contain', 'What do you in your free time?');
    cy.get('.step').first().should('contain', 'Selected: Learn Python');
    cy.contains('button', 'Create new projects').click();
    cy.get('.step')
      .last()
      .should('not.contain', 'What do you in your free time?');
    cy.get('.step').last().should('contain', 'Selected: Create new projects');
  });
});
