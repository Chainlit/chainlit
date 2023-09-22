import { runTestServer } from '../../support/testUtils';

function openPlayground(index) {
  cy.get('.playground-button').eq(index).should('exist').click();
}
const expectedTemplate =
  'Hello, this is a template.This is a simple variable {variable1}This is a another simple {variable2}Those are two simple variables {variable1} + {variable2}This is a formatting test {{variable1}} {{{variable2}}} {variable3}This is another formatting test {{{{variable1}}}} {{{{{variable1}}}}}This is a curly braces formatting test {{ {{{{ }} }}}}';

const expectedFormattedTemplate =
  'Hello, this is a template.This is a simple variable variable1 valueThis is a another simple variable2 valueThose are two simple variables variable1 value + variable2 valueThis is a formatting test {variable1} {variable2 value} {{variable3 value}}This is another formatting test {{variable1}} {{variable1 value}}This is a curly braces formatting test { {{ } }}';
const variable1ExpectedContent = 'variable1 value';

const expectedFormatted = `This is a test formatted prompt`;

const expectedCompletion = 'This is the test completion';

function testTemplate(chat?: boolean) {
  it('should display the template and highlight the variables', () => {
    cy.get('.tab-Template').should('exist').click();

    cy.get('.template-editor [contenteditable]')
      .should('exist')
      .should('contain', expectedTemplate);

    const expectedCount = chat ? 6 : 3;

    cy.get('.input-variable1').should('have.length', expectedCount);

    cy.get('.input-variable2').should('have.length', expectedCount);
  });

  it('should let the user click a variable to edit its value', () => {
    cy.get('.input-variable1').eq(0).click();

    cy.get('#variable-modal [contenteditable]')
      .should('exist')
      .should('contain', variable1ExpectedContent);

    cy.get('#edit-variable').should('exist').click();
  });

  it('should display the formatted template', () => {
    cy.get('.tab-Formatted').should('exist').click();
    cy.get('.formatted-editor [contenteditable]')
      .should('exist')
      .should('contain', expectedFormattedTemplate);
  });

  it('should prevent the user to update the formatted template', () => {
    cy.get('.tab-Formatted').should('exist').click();
    cy.get('.formatted-editor [contenteditable]').eq(0).type('foobar');

    cy.get('.tab-Formatted').click();

    cy.get('.formatted-editor [contenteditable]')
      .eq(0)
      .should('contain', expectedFormattedTemplate);
  });
}

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

  describe('Basic template', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(0);
    });
    testTemplate(false);
    testCompletion();
    testSettings(false);
  });

  describe('Basic formatted', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(1);
    });

    testFormatted();
    testCompletion();
    testSettings(false);
  });

  describe('Chat template', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(2);
    });
    testTemplate(true);
    testCompletion();
    testSettings(true);
  });

  describe('Chat formatted', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(3);
    });

    testFormatted();
    testCompletion();
    testSettings(true);
  });

  describe('Langchain provider', () => {
    beforeEach(() => {
      cy.visit('/');
      openPlayground(3);
      cy.get('#llm-providers').parent().click();
      cy.get('[data-value=test-langchain]').click();
    });

    testCompletion();
  });
});
