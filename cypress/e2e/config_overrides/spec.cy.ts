import { submitMessage } from '../../support/testUtils';

describe('Config overrides with chat profiles', () => {
  it('should be able to select a chat profile and test MCP button visibility', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    // Wait for the interface to be ready
    cy.get('#starter-default-chat', { timeout: 10000 }).should('exist').click();

    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Start a conversation with default settings');

    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'starting chat with admin using the Default Profile chat profile'
      );

    // Test that MCP button (lucide plug) does not exist on Default Profile
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]').should('exist');
    cy.get('[data-test="select-item:MCP Enabled"]').should('exist');
    cy.get('[data-test="select-item:MCP Disabled"]').should('exist');

    // Change to MCP Enabled chat profile
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();

    // Wait for the profile to switch
    cy.get('#starter-mcp-test', { timeout: 10000 }).should('not.be.disabled').click();

    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Test MCP functionality');

    cy.get('.step')
      .eq(1)
      .should(
        'contain',
        'starting chat with admin using the MCP Enabled chat profile'
      );

    // Test that MCP button (lucide plug) exists on MCP Enabled profile
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist').should('be.visible');

    // Test switching to MCP Disabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Disabled"]').click();
    cy.get('#confirm').click();

    // Test that MCP button (lucide plug) does not exist on MCP Disabled profile
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#header').get('#new-chat-button').click({ force: true });
    cy.get('#confirm').click();

    cy.get('#starter-mcp-test').should('exist');

    cy.get('.step').should('have.length', 0);

    submitMessage('hello');
    cy.get('.step').should('have.length', 2).eq(0).should('contain', 'hello');
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();

    // Verify MCP button appears again when switching back to MCP Enabled
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist').should('be.visible');

    cy.get('#starter-mcp-test').should('exist');
  });

  it('should keep chat profile description visible when hovering over a link', () => {
    cy.visit('/');
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');

    cy.get('#chat-profiles').click();

    // Force hover over MCP Enabled profile to show description
    cy.get('[data-test="select-item:MCP Enabled"]').focus();

    // Wait for the popover to appear and check its content
    cy.get('#chat-profile-description').within(() => {
      cy.contains('Learn more').should('be.visible');
    });

    // Check if the link is present in the description and has correct attributes
    const linkSelector = '#chat-profile-description a:contains("Learn more")';
    cy.get(linkSelector)
      .should('have.attr', 'href', 'https://example.com/mcp')
      .and('have.attr', 'target', '_blank');

    // Move mouse to the link
    cy.get(linkSelector).trigger('mouseover', { force: true });

    // Verify that the description is still visible after
    cy.get('#chat-profile-description').within(() => {
      cy.contains('Learn more').should('be.visible');
    });

    // Verify that the link is still present and clickable
    cy.get(linkSelector)
      .should('exist')
      .and('be.visible')
      .and('not.have.css', 'pointer-events', 'none')
      .and('not.have.attr', 'disabled');

    // Ensure the chat profile selector is still open
    cy.get('[data-test="select-item:MCP Enabled"]').should('be.visible');

    // Select MCP Enabled profile
    cy.get('[data-test="select-item:MCP Enabled"]').click();

    // Wait for the profile to be selected and verify MCP button appears
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist');

    // Verify the profile has been changed
    submitMessage('hello');
    cy.get('.step')
      .should('have.length', 2)
      .last()
      .should(
        'contain',
        'starting chat with admin using the MCP Enabled chat profile'
      );
  });
});