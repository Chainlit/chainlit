import { runTestServer } from '../../support/testUtils';

const getIframeWindow = () => {
  return cy
    .get('iframe[data-cy="the-frame"]')
    .its('0.contentWindow')
    .should('exist');
};

describe('Window Message', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to send and receive window messages', () => {
    cy.visit('/public/iframe.html');

    cy.get('div#message').should('contain', 'No message received');

    getIframeWindow().then((win) => {
      cy.wait(1000).then(() => {
        win.postMessage('Client: Hello', '*');
      });
    });

    cy.get('div#message').should('contain', 'Server: World');
  });
});
