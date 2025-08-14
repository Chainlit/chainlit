import { submitMessage } from '../../support/testUtils';

describe('Config Overrides with Chat Profiles', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Wait for the chat interface to load
    cy.get('#chat-input', { timeout: 15000 }).should('exist').should('be.visible');
  });

  it('should show MCP button only for profiles with MCP enabled', () => {
    // Add wait to ensure profile selector is ready
    cy.get('#chat-profiles', { timeout: 10000 }).should('be.visible').click();
    
    // Wait for profile options to appear
    cy.get('[data-test="select-item:Default Profile"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    // MCP button should not be visible
    cy.get('[data-testid="mcp-button"]').should('not.exist');
    
    // Also check that the plug icon is not present in the message composer
    cy.get('.lucide-plug').should('not.exist');

    // Switch to MCP enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    // MCP button should now be visible
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist').should('be.visible');
    
    // Test that the MCP dialog can be opened
    cy.get('.lucide-plug').parent().click();
    cy.get('#mcp-servers', { timeout: 5000 }).should('exist');
    cy.get('#mcp-servers').should('contain', 'MCP Servers');
    
    // Close the MCP dialog
    cy.get('body').type('{esc}');

    // Switch to MCP disabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Disabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    // MCP button should not be visible again
    cy.get('[data-testid="mcp-button"]').should('not.exist');
    cy.get('.lucide-plug').should('not.exist');
  });

  it('should send messages correctly with different profiles', () => {
    // Test with MCP enabled profile
    cy.get('#chat-profiles', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-test="select-item:MCP Enabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    submitMessage('Hello with MCP');
    
    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Hello with MCP');

    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat using MCP Enabled profile');

    // Verify MCP button is still present
    cy.get('.lucide-plug').should('exist');

    // Switch to default profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    submitMessage('Hello without MCP');
    
    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Hello without MCP');

    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat using Default Profile profile');

    // Verify MCP button is not present
    cy.get('.lucide-plug').should('not.exist');
  });

  it('should preserve UI settings overrides', () => {
    // Switch to MCP enabled profile which has UI name override
    cy.get('#chat-profiles', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-test="select-item:MCP Enabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();

    // The UI should reflect the overridden name
    // This tests that config merging is working properly
    // Note: The exact assertion would depend on where the UI name is displayed
    // For now, we verify that the profile switch worked and MCP is enabled
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist');
    
    submitMessage('Test UI override');
    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat using MCP Enabled profile');
  });

  it('should handle profile switching correctly', () => {
    // Verify all three profiles are available
    cy.get('#chat-profiles', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-test="select-item:Default Profile"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-test="select-item:MCP Enabled"]').should('be.visible');
    cy.get('[data-test="select-item:MCP Disabled"]').should('be.visible');

    // Test rapid switching between profiles
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Disabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]', { timeout: 5000 }).should('be.visible').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug', { timeout: 10000 }).should('exist');
  });
});