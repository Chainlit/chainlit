import { submitMessage } from '../../support/testUtils';

describe('MCP Auto-Connection', () => {
  it('should display auto-connection information with MCP enabled profile', () => {
    cy.visit('/');
    
    // Login first
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
    
    // Wait for initial load
    cy.wait(1000);
    
    // Check default profile message
    cy.get('.step')
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test')
      .should('contain', 'MCP Enabled Profile')
      .should('contain', 'auto-connection feature');
    
    // Test status command
    submitMessage('status');
    cy.get('.step')
      .should('have.length', 3) // Original message + user message + response
      .last()
      .should('contain', 'Current MCP Connections')
      .should('contain', 'MCP Enabled Profile');
  });

  it('should switch to regular profile and show different behavior', () => {
    cy.visit('/');
    
    // Login first
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
    
    // Wait for initial load
    cy.wait(1000);
    
    // Switch to Regular Profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Regular Profile"]').should('exist');
    cy.get('[data-test="select-item:Regular Profile"]').click();
    cy.get('#confirm').click();
    
    // Wait for profile switch
    cy.wait(1000);
    
    // Check new profile message
    cy.get('.step')
      .should('have.length', 1)
      .should('contain', 'Regular Chat Profile')
      .should('contain', 'Regular Profile')
      .should('contain', 'standard chat profile');
    
    // Test status command with regular profile
    submitMessage('status');
    cy.get('.step')
      .should('have.length', 3)
      .last()
      .should('contain', 'Current MCP Connections')
      .should('contain', 'Regular Profile');
  });

  it('should switch back to MCP profile and verify functionality', () => {
    cy.visit('/');
    
    // Login first
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
    
    // Wait for initial load
    cy.wait(1000);
    
    // Start with Regular Profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Regular Profile"]').click();
    cy.get('#confirm').click();
    cy.wait(1000);
    
    // Verify regular profile is active
    cy.get('.step')
      .should('contain', 'Regular Chat Profile');
    
    // Switch back to MCP profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Enabled Profile"]').click();
    cy.get('#confirm').click();
    cy.wait(1000);
    
    // Verify MCP profile is active
    cy.get('.step')
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test')
      .should('contain', 'Configuration Example')
      .should('contain', 'auto_connect = true');
  });

  it('should handle message interactions correctly', () => {
    cy.visit('/');
    
    // Login first
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
    
    // Wait for initial load
    cy.wait(1000);
    
    // Test regular message
    submitMessage('hello world');
    cy.get('.step')
      .should('have.length', 3)
      .last()
      .should('contain', 'Echo: hello world')
      .should('contain', 'MCP Enabled Profile');
    
    // Test MCP status command
    submitMessage('mcp');
    cy.get('.step')
      .should('have.length', 5)
      .last()
      .should('contain', 'Current MCP Connections')
      .should('contain', 'configure MCP servers');
    
    // Test connections command
    submitMessage('connections');
    cy.get('.step')
      .should('have.length', 7)
      .last()
      .should('contain', 'Current MCP Connections');
  });

  it('should maintain profile state across interactions', () => {
    cy.visit('/');
    
    // Login first
    cy.get("input[name='email']").type('admin');
    cy.get("input[name='password']").type('admin');
    cy.get("button[type='submit']").click();
    cy.get('#chat-input').should('exist');
    
    // Wait and switch to regular profile
    cy.wait(1000);
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:Regular Profile"]').click();
    cy.get('#confirm').click();
    cy.wait(1000);
    
    // Send multiple messages and verify profile consistency
    submitMessage('test message 1');
    cy.get('.step')
      .last()
      .should('contain', 'Regular Profile');
    
    submitMessage('status');
    cy.get('.step')
      .last()
      .should('contain', 'Regular Profile');
    
    submitMessage('another message');
    cy.get('.step')
      .last()
      .should('contain', 'Regular Profile');
  });
});