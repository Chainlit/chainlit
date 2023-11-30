import { runTestServer } from '../../support/testUtils';

describe('Upload file', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to receive and decode files', () => {
    cy.get('#ask-upload-button').should('exist');

    // Upload a text file
    cy.fixture('state_of_the_union.txt', 'utf-8').as('txtFile');
    cy.get('#ask-button-input').selectFile('@txtFile', { force: true });

    // Sometimes the loading indicator is not shown because the file upload is too fast
    // cy.get("#ask-upload-button-loading").should("exist");
    // cy.get("#ask-upload-button-loading").should("not.exist");

    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'Text file state_of_the_union.txt uploaded, it contains'
      );

    cy.get('#ask-upload-button').should('exist');

    // Expecting a python file, cpp file upload should be rejected
    cy.fixture('hello.cpp', 'utf-8').as('cppFile');
    cy.get('#ask-button-input').selectFile('@cppFile', { force: true });

    cy.get('.step').should('have.length', 3);

    // Upload a python file
    cy.fixture('hello.py', 'utf-8').as('pyFile');
    cy.get('#ask-button-input').selectFile('@pyFile', { force: true });

    cy.get('.step')
      .should('have.length', 4)
      .eq(3)
      .should('contain', 'Python file hello.py uploaded, it contains');

    cy.get('#ask-upload-button').should('not.exist');
  });
});
