const getIframeWindow = () => {
  return cy
    .get('iframe[data-cy="the-frame"]')
    .its('0.contentWindow')
    .should('exist');
};

describe('Window Message', () => {
  it('should be able to send and receive window messages', () => {
    cy.visit('/public/iframe.html');

    cy.get('div#message').should('contain', 'No message received');

    // Same as other e2e specs (e.g. on_chat_start), but Chainlit UI lives inside the iframe.
    cy.get('iframe[data-cy="the-frame"]')
      .its('0.contentDocument.body')
      .should('be.visible')
      .find('.step')
      .should('have.length.at.least', 1)
      .eq(0)
      .should('contain', 'Window message test ready');

    getIframeWindow().then((win) => {
      win.postMessage('Client: Hello', '*');
    });

    cy.get('div#message').should('contain', 'Server: World');
  });
});
