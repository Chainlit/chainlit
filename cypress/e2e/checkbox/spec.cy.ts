import { runTestServer } from '../../support/testUtils';

describe('Checkbox', () => {
  before(() => {
    runTestServer();
  });

  it('ensures checkboxes work and that values are displayed upon submission', () => {
    cy.get('[type="checkbox"]').should('exist');

    cy.get('.checkbox-group .MuiFormControlLabel-root')
      .eq(2)
      .should('contain', 'single_family')
      .find('input[type="checkbox"]')
      .should('not.be.checked')
      .click()
      .should('be.checked');

    cy.get('.checkbox-group .MuiFormControlLabel-root')
      .eq(5)
      .should('contain', 'other')
      .find('input[type="checkbox"]')
      .should('not.be.checked')
      .click()
      .should('be.checked');

    cy.get('.MuiButton-containedPrimary').click();

    cy.get('.markdown-body')
      .should('contain', 'single_family')
      .should('contain', 'other');
  });
});
