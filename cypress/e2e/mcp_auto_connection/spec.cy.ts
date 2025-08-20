import { submitMessage } from '../../support/testUtils';

describe('MCP Auto-Connection', () => {
  it('should auto-connect to servers with auto_connect=true', () => {
    cy.visit('/');
    
    // Select MCP Auto-Connect Enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Enabled"]').should('exist');
    cy.get('[data-test="select-item:MCP Auto-Connect Enabled"]').click();
    cy.get('#confirm').click();
    
    // Wait for chat start message with auto-connection results
    cy.get('.step', { timeout: 10000 })
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test Results')
      .should('contain', 'MCP Auto-Connect Enabled')
      .should('contain', 'Connected Servers: 2')
      .should('contain', 'test-server-1, test-server-2')
      .should('contain', '✅ SUCCESS');
    
    // Verify MCP button is visible (indicates MCP is enabled)
    cy.get('.lucide-plug').should('exist').should('be.visible');
    
    // Test status command to verify connections
    submitMessage('status');
    cy.get('.step')
      .should('have.length', 3) // Original message + user message + response
      .last()
      .should('contain', 'Current MCP Connections')
      .should('contain', 'test-server-1: Connected')
      .should('contain', 'test-server-2: Connected')
      .should('contain', 'Total: 2 server(s)');
  });

  it('should not auto-connect when MCP is disabled', () => {
    cy.visit('/');
    
    // Select MCP Auto-Connect Disabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Disabled"]').should('exist');
    cy.get('[data-test="select-item:MCP Auto-Connect Disabled"]').click();
    cy.get('#confirm').click();
    
    // Wait for chat start message
    cy.get('.step', { timeout: 10000 })
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test Results')
      .should('contain', 'MCP Auto-Connect Disabled')
      .should('contain', 'Connected Servers: 0')
      .should('contain', '✅ SUCCESS');
    
    // Verify MCP button is NOT visible (MCP is disabled)
    cy.get('.lucide-plug').should('not.exist');
    
    // Test status command to confirm no connections
    submitMessage('status');
    cy.get('.step')
      .should('have.length', 3)
      .last()
      .should('contain', 'No MCP servers connected');
  });

  it('should handle profile with no servers configured', () => {
    cy.visit('/');
    
    // Select MCP No Servers profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP No Servers"]').should('exist');
    cy.get('[data-test="select-item:MCP No Servers"]').click();
    cy.get('#confirm').click();
    
    // Wait for chat start message
    cy.get('.step', { timeout: 10000 })
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test Results')
      .should('contain', 'MCP No Servers')
      .should('contain', 'Connected Servers: 0')
      .should('contain', '✅ SUCCESS');
    
    // Verify MCP button is visible (MCP is enabled, but no servers)
    cy.get('.lucide-plug').should('exist').should('be.visible');
    
    // Test status command to confirm no connections
    submitMessage('status');
    cy.get('.step')
      .should('have.length', 3)
      .last()
      .should('contain', 'No MCP servers connected');
  });

  it('should switch between profiles and update auto-connections accordingly', () => {
    cy.visit('/');
    
    // Start with MCP enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Enabled"]').click();
    cy.get('#confirm').click();
    
    // Verify initial connections
    cy.get('.step')
      .should('contain', 'Connected Servers: 2')
      .should('contain', '✅ SUCCESS');
    
    // Switch to disabled profile  
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Disabled"]').click();
    cy.get('#confirm').click();
    
    // Verify connections are cleared/disabled
    cy.get('.step')
      .last()
      .should('contain', 'MCP Auto-Connect Disabled')
      .should('contain', 'Connected Servers: 0');
    
    // Verify MCP button is gone
    cy.get('.lucide-plug').should('not.exist');
    
    // Switch back to enabled profile
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Enabled"]').click();
    cy.get('#confirm').click();
    
    // Verify connections are restored
    cy.get('.step')
      .last()
      .should('contain', 'MCP Auto-Connect Enabled')
      .should('contain', 'Connected Servers: 2');
    
    // Verify MCP button is back
    cy.get('.lucide-plug').should('exist').should('be.visible');
  });

  it('should handle auto-connection errors gracefully', () => {
    cy.visit('/');
    
    // Test with enabled profile (even if some connections fail, it should handle gracefully)
    cy.get('#chat-profiles').click();
    cy.get('[data-test="select-item:MCP Auto-Connect Enabled"]').click();
    cy.get('#confirm').click();
    
    // Wait for some response (success or partial failure)
    cy.get('.step', { timeout: 15000 })
      .should('have.length', 1)
      .should('contain', 'MCP Auto-Connection Test Results');
    
    // The test should not crash even if some connections fail
    // We just verify the interface remains functional
    submitMessage('hello world');
    cy.get('.step')
      .should('have.length', 3)
      .last()
      .should('contain', 'Echo: hello world');
  });
});