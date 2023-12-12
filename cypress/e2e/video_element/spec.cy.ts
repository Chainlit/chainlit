import { runTestServer } from '../../support/testUtils';

describe('video', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display a video element', () => {
    cy.get('.step').should('have.length', 1);
    cy.get('.step').eq(0).find('.inline-video').should('have.length', 1);

    cy.get('video.inline-video')
      .then(($el) => {
        const videoElement = $el.get(0) as HTMLVideoElement;
        return videoElement.play().then(() => {
          return videoElement.duration;
        });
      })
      .should('be.greaterThan', 0);
  });
});
