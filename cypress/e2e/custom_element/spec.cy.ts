import { runTestServer } from '../../support/testUtils';

describe('Custom Element', () => {
  before(() => {
    runTestServer();
  });

  function getCustomElement() {
    return cy.get('.step').eq(0).find('.inline-custom').first()
  }

  it('should be able to render an interactive custom element', () => {
    cy.get('.step').should('have.length', 1);

    cy.get('.step').eq(0).find('.inline-custom').should('have.length', 1);

    getCustomElement().should('contain', 'Count: 1');

    getCustomElement().find("#increment").click()
    getCustomElement().should('contain', 'Count: 2');

    getCustomElement().find("#increment").click()
    getCustomElement().should('contain', 'Count: 3');

    getCustomElement().find("#action").click()

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Executed test action!');

    getCustomElement().find("#remove").click()
    cy.get('.step').eq(0).find('.inline-custom').should("not.exist")

  });
});
