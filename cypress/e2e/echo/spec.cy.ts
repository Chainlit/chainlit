import { runTestServer, submitMessage } from '../../support/testUtils';

describe('Basic echo example', () => {
  before(() => {
    runTestServer();
  });

  describe('Steps', () => {
    beforeEach(() => {
      cy.visit('/');
      submitMessage("I'm functional.");
      cy.get('.step').as('steps');
    });

    it('should show 2 steps', () => {
      cy.get('@steps').should('have.length', 2);
    });

    describe('User message', () => {
      beforeEach(() => {
        cy.get('@steps').eq(0).as('user_message');
      });

      it('should contain the submitted message ', () => {
        cy.get('@user_message').should('contain', "I'm functional.");
      });
    });

    describe('AI message', () => {
      beforeEach(() => {
        cy.get('@steps').eq(1).as('ai_message');
      });

      it('should echo submitted message, prefixed by: "Received: "', () => {
        cy.get('@ai_message').should('contain', "Received: I'm functional.");
      });

      describe('avatar', () => {
        beforeEach(() => {
          cy.get('@ai_message').find('.message-avatar').as('message_avatar');
          cy.get('@message_avatar')
            .find('.MuiAvatar-root img')
            .as('avatar_img');
        });

        it('should have "My Assistant" as label', () => {
          cy.get('@message_avatar')
            .find('.MuiAvatar-root')
            .should('have.attr', 'aria-label', 'My Assistant');
        });

        it('should load /avatars/my_assistant', () => {
          cy.get('@avatar_img')
            .should('have.length', 1)
            .should('have.attr', 'src')
            .and('include', '/avatars/my_assistant');

          cy.get('@avatar_img')
            .should('be.visible')
            .and(($img) => {
              const img = $img[0] as HTMLImageElement;
              expect(img.naturalWidth).to.be.greaterThan(0);
            });
        });
      });
    });
  });
});
