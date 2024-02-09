import { runTestServer } from '../../support/testUtils';

function openPlayground(index) {
  cy.get('.playground-button').eq(index).should('exist').click();
}

const expectedFormatted = `This is a test formatted prompt`;

const expectedCompletion = 'This is the test completion';

function testFormatted() {
  // it("should display the missing template warning", () => {
  //   cy.get("#template-warning").should("exist");
  // });

  it('should display the formatted prompt', () => {
    cy.get('.formatted-editor [contenteditable]')
      .should('exist')
      .should('contain', expectedFormatted);
  });

  it('should let the user update the formatted prompt', () => {
    cy.get('.formatted-editor [contenteditable]')
      .eq(0)
      .type('foobar')
      .should('contain', 'foobar' + expectedFormatted);
  });
}

function testCompletion() {
  it('should be able to call the LLM provider and stream the completion', () => {
    // Wait for the llm provider
    cy.wait(1000);
    cy.get('#submit-prompt').should('exist').click();
    cy.get('.completion-editor [contenteditable]').should(
      'contain',
      expectedCompletion
    );
  });
}

function testSettings(chat?: boolean) {
  it('should be able to switch providers and preserve settings', () => {
    const initialModel = chat ? 'test-model-chat-2' : 'test-model-2';
    const nextModel = chat ? 'test-model-2' : 'test-model-chat-2';

    const optionTarget = chat ? '[data-value=test]' : '[data-value=test-chat]';

    cy.get('#model').invoke('val').should('equal', initialModel);
    cy.get('#temperature').invoke('val').should('equal', '1');
    cy.get('#llm-providers').parent().click();
    cy.get(optionTarget).click();
    cy.get('#model').invoke('val').should('equal', nextModel);
    cy.get('#temperature').invoke('val').should('equal', '1');
  });
}

describe('PromptPlayground', () => {
  before(() => {
    runTestServer();
  });

  describe('Completion', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(0);
    });

    testFormatted();
    testCompletion();
    testSettings(false);
  });

  describe('Chat', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(1);
    });

    testFormatted();
    testCompletion();
    testSettings(true);
  });

  describe('Langchain provider', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(1);
      cy.get('#llm-providers').parent().click();
      cy.get('[data-value=test-langchain]').click();
    });

    testCompletion();
  });
});
