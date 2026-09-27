import { submitMessage } from '../../support/testUtils';

describe('Step details disabled', () => {
  it('keeps a collapsible step hierarchy but hides input/output detail', () => {
    cy.visit('/');
    submitMessage('go');

    // Root is a collapsible accordion, collapsed by default.
    cy.get('#step-root')
      .should('be.visible')
      .and('have.attr', 'data-state', 'closed');

    // Nested steps stay hidden until expanded (hierarchy preserved, not forced open).
    cy.get('#step-branch').should('not.exist');

    // Drilling down reveals the hierarchy one level at a time.
    cy.get('#step-root').click();
    cy.get('#step-branch').should('be.visible');
    cy.get('#step-branch').click();
    cy.get('#step-leaf').should('be.visible');

    // Input/output payloads are hidden: the step return values never render.
    cy.contains('Root result').should('not.exist');
    cy.contains('Branch result').should('not.exist');

    cy.contains('Final answer').should('be.visible');
  });
});
