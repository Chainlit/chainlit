import { runTestServer } from '../../support/testUtils';

describe('Conversations', () => {
  before(() => {
    runTestServer(undefined, {
      CHAINLIT_API_KEY: 'fake_key',
      CHAINLIT_AUTH_SECRET:
        'G=>I6me4>E_y,n$_%K%XqbTMKXGQy-jvZ6:1oR>~o8z@DPb*.QY~NkgctmBDg3T-'
    });

    cy.intercept('POST', '/login', {
      statusCode: 200,
      body: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6IkFETUlOIiwidGFncyI6W10sImltYWdlIjpudWxsLCJwcm92aWRlciI6ImNyZWRlbnRpYWxzIiwiZXhwIjoxNjk4MTM5MzgwfQ.VQS_O0Zar1O3BVzJ_bu4_8r-1LW0Mfq2En7sIojzd04',
        token_type: 'bearer'
      }
    }).as('postLogin');

    cy.intercept('GET', '/project/settings', {
      statusCode: 200,
      body: {
        ui: {
          show_readme_as_default: true
        },
        userEnv: [],
        dataPersistence: true,
        markdown: 'foo',
        chatProfiles: []
      }
    }).as('getSettings');

    const makeData = (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: String(start + i),
        createdAt: Date.now(),
        tags: ['chat'],
        elementCount: 0,
        messageCount: 3,
        appUser: { username: 'admin' },
        messages: [{ content: `foo ${start + i}` }]
      }));

    cy.intercept('POST', '/project/conversations', (req) => {
      const { cursor } = req.body.pagination;
      const dataCount = cursor ? 3 : 20;
      const startId = cursor ? 21 : 1;

      req.reply({
        statusCode: 200,
        body: {
          pageInfo: {
            hasNextPage: !cursor,
            endCursor: cursor ? 'newCursor' : 'someCursor'
          },
          data: makeData(startId, dataCount)
        }
      });
    }).as('getConversations');

    cy.intercept('GET', '/project/conversation/*', (req) => {
      const conversationId = req.url.split('/').pop();

      req.reply({
        statusCode: 200,
        body: {
          id: conversationId,
          createdAt: Date.now(),
          tags: ['chat'],
          messages: [
            {
              id: '2b1755ab-f7e3-48fa-9fe1-535595142b96',
              isError: false,
              parentId: null,
              indent: 0,
              author: 'Chatbot',
              content: `Foo ${conversationId} message`,
              waitForAnswer: false,
              humanFeedback: 0,
              humanFeedbackComment: null,
              disableHumanFeedback: false,
              language: null,
              prompt: null,
              authorIsUser: false,
              createdAt: 1696844037149
            }
          ],
          elements: []
        }
      });
    }).as('getConversation');

    cy.intercept('DELETE', '/project/conversation', {
      statusCode: 200,
      body: {
        success: true
      }
    }).as('deleteConversation');
  });

  describe('Conversations history', () => {
    it('should perform conversations history operations', () => {
      // Login to the app
      cy.get("[id='email']").type('admin');
      cy.get("[id='password']").type('admin{enter}');

      // Conversations are being displayed
      cy.contains('Foo 1');
      cy.contains('Foo 2');

      // Scroll chat and fetch new conversations
      cy.get('.chat-history-drawer > div').scrollTo('bottom');
      cy.get('#chat-history-loader').should('be.visible');
      cy.contains('Foo 23');

      // Select conversation
      cy.get('#conversation-18').click();
      cy.get('#conversation-18').should('be.visible');
      cy.contains('Foo 18 message');

      // Delete conversation
      cy.get("[data-testid='DeleteOutlineIcon']").click();
      cy.get("[type='button']").contains('Confirm').click();
      cy.contains('Conversation deleted!');
    });
  });
});
