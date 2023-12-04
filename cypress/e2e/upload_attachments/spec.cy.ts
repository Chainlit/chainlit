import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Upload attachments', () => {
  beforeEach(() => {
    runTestServer();
  });

  const shouldHaveInlineAttachments = () => {
    submitMessage('Message with attachments');
    cy.get('.step').should('have.length', 5);
    cy.get('.step')
      .eq(1)
      .should('contain', 'Content: Message with attachments');
    cy.get('.step')
      .eq(2)
      .should('contain', 'Received element 0: state_of_the_union.txt');
    cy.get('.step').eq(3).should('contain', 'Received element 1: hello.cpp');
    cy.get('.step').eq(4).should('contain', 'Received element 2: hello.py');

    cy.get('.step').eq(0).find('.inline-file').should('have.length', 3);
    cy.get('.inline-file')
      .eq(0)
      .should('have.attr', 'download', 'state_of_the_union.txt');
    cy.get('.inline-file').eq(1).should('have.attr', 'download', 'hello.cpp');
    cy.get('.inline-file').eq(2).should('have.attr', 'download', 'hello.py');
  };

  it('Should be able to upload file attachments', () => {
    cy.fixture('state_of_the_union.txt', 'utf-8').as('txtFile');
    cy.fixture('hello.cpp', 'utf-8').as('cppFile');
    cy.fixture('hello.py', 'utf-8').as('pyFile');

    // Wait for the socket connection to be created
    cy.wait(1000);

    /**
     * Should be able to upload file from D&D input
     */
    cy.get("[id='#upload-drop-input']").should('exist');
    // Upload a text file
    cy.get("[id='#upload-drop-input']").selectFile('@txtFile', { force: true });
    cy.get('#attachments').should('contain', 'state_of_the_union.txt');

    // Upload a C++ file
    cy.get("[id='#upload-drop-input']").selectFile('@cppFile', { force: true });
    cy.get('#attachments').should('contain', 'hello.cpp');

    // Upload a python file
    cy.get("[id='#upload-drop-input']").selectFile('@pyFile', { force: true });
    cy.get('#attachments').should('contain', 'hello.py');

    shouldHaveInlineAttachments();

    /**
     * Should be able to upload file from upload button
     */
    cy.reload();
    cy.get('#upload-button').should('exist');

    // Upload a text file
    cy.get('#upload-button-input').selectFile('@txtFile', { force: true });
    cy.get('#attachments').should('contain', 'state_of_the_union.txt');

    // Upload a C++ file
    cy.get('#upload-button-input').selectFile('@cppFile', { force: true });
    cy.get('#attachments').should('contain', 'hello.cpp');

    // Upload a python file
    cy.get('#upload-button-input').selectFile('@pyFile', { force: true });
    cy.get('#attachments').should('contain', 'hello.py');

    shouldHaveInlineAttachments();
  });
});
