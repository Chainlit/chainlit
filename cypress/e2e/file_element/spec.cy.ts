import { runTestServer } from '../../support/testUtils';

describe('file', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display a file element', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-file').should('have.length', 4);

    cy.get('.inline-file').should(($files) => {
      const downloads = $files
        .map((i, el) => Cypress.$(el).attr('download'))
        .get();

      expect(downloads).to.have.members([
        'example.mp4',
        'cat.jpeg',
        'hello.py',
        'example.mp3'
      ]);
    });
  });
});
