import { runTestServer } from '../../support/testUtils';

describe('video', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display video elements from local path and external urls', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-video').should('have.length', 3);

    cy.get('.inline-video video')
      .then(($el) => {
        const videoElement = $el.get(0) as HTMLVideoElement;
        return videoElement.play().then(() => {
          return videoElement.duration;
        });
      })
      .should('be.greaterThan', 0);

    // Check if YouTube video is loaded with the right title and the right properties for video id, autoplay and start
    cy.get('.inline-video iframe')
      .eq(0)
      .should('be.visible')
      .should(
        'have.attr',
        'title',
        'Try Not To Laugh Challenge - Funny Cat & Dog Vines compilation 2017'
      )
      .invoke('attr', 'src')
      .should('contain', 'EtH9Yllzjcc')
      .should('contain', 'autoplay=1')
      .should('contain', 'start=36');

    // Check if Vimeo video is loaded with the right title and the right properties for video id, autoplay and start
    cy.get('.inline-video iframe')
      .eq(1)
      .should('be.visible')
      .should('have.attr', 'title', 'Custom Title for Chainlit testing')
      .invoke('attr', 'src')
      .should('contain', '362164795')
      .should('contain', 'autoplay=1')
      .should('contain', 'muted=1')
      .should('contain', 't=36');
  });
});
