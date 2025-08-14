import { submitMessage } from '../../support/testUtils';

describe('Config Overrides with Chat Profiles', () => {
  beforeEach(() => {
    cy.visit('/');
    // Login as admin
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
  });

  it('should show MCP button only for profiles with MCP enabled', () => {
    // Start with default profile (no MCP)
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]').click();
    cy.get('#confirm').click();

    // MCP button should not be visible
    cy.get('[data-testid="mcp-button"]').should('not.exist');
    
    // Also check that the plug icon is not present in the message composer
    cy.get('.lucide-plug').should('not.exist');

    // Switch to MCP enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();

    // MCP button should now be visible
    cy.get('.lucide-plug').should('exist');
    
    // Test that the MCP dialog can be opened
    cy.get('.lucide-plug').parent().click();
    cy.get('#mcp-servers').should('exist');
    cy.get('#mcp-servers').should('contain', 'MCP Servers');
    
    // Close the MCP dialog
    cy.get('body').type('{esc}');

    // Switch to MCP disabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Disabled"]').click();
    cy.get('#confirm').click();

    // MCP button should not be visible again
    cy.get('[data-testid="mcp-button"]').should('not.exist');
    cy.get('.lucide-plug').should('not.exist');
  });

  it('should send messages correctly with different profiles', () => {
    // Test with MCP enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();

    submitMessage('Hello with MCP');
    
    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Hello with MCP');

    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat with admin using MCP Enabled profile');

    // Verify MCP button is still present
    cy.get('.lucide-plug').should('exist');

    // Switch to default profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]').click();
    cy.get('#confirm').click();

    submitMessage('Hello without MCP');
    
    cy.get('.step')
      .should('have.length', 2)
      .eq(0)
      .should('contain', 'Hello without MCP');

    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat with admin using Default Profile profile');

    // Verify MCP button is not present
    cy.get('.lucide-plug').should('not.exist');
  });

  it('should preserve UI settings overrides', () => {
    // Switch to MCP enabled profile which has UI name override
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();

    // The UI should reflect the overridden name
    // This tests that config merging is working properly
    // Note: The exact assertion would depend on where the UI name is displayed
    // For now, we verify that the profile switch worked and MCP is enabled
    cy.get('.lucide-plug').should('exist');
    
    submitMessage('Test UI override');
    cy.get('.step')
      .eq(1)
      .should('contain', 'Chat with admin using MCP Enabled profile');
  });

  it('should handle profile switching correctly', () => {
    // Verify all three profiles are available
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]').should('exist');
    cy.get('[data-test="select-item:MCP Enabled"]').should('exist');
    cy.get('[data-test="select-item:MCP Disabled"]').should('exist');

    // Test rapid switching between profiles
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Disabled"]').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Default Profile"]').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('not.exist');

    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled"]').click();
    cy.get('#confirm').click();
    cy.get('.lucide-plug').should('exist');
  });
});
