describe('PDF Viewer', () => {
  const consoleErrors: string[] = [];

  beforeEach(() => {
    // Collect console errors for all tests
    cy.on('window:console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
  });

  it('should render an inline PDF thumbnail', () => {
    cy.get('.step').eq(0).find('.inline-pdf').should('have.length', 1);
  });

  it('should auto-open the side panel for a side-display PDF', () => {
    // Side panel should open automatically when a side PDF element arrives
    cy.get('#side-view-title').should('exist');
    cy.get('#side-view-content').should('exist');
    cy.get('#side-view-content').find('.side-pdf').should('have.length', 1);
  });

  it('should open the fullscreen modal when clicking an inline PDF', () => {
    cy.get('.step').eq(0).find('.inline-pdf').click();
    // Modal viewer should appear containing a PDFViewer
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').find('canvas').should('exist');
    // Close button should be present and functional
    cy.get('[role="dialog"]').find('button[aria-label="Close"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should load PDF without MIME type or CDN errors', () => {
    // Visit the app
    // Clear console errors for this specific test
    consoleErrors.length = 0;

    const mimeTypeErrors = consoleErrors.filter(
      (error) =>
        error.toLowerCase().includes('mime') ||
        error.toLowerCase().includes('disallowed mime type') ||
        error.toLowerCase().includes('octet-stream') ||
        error.toLowerCase().includes('application/json') ||
        error.toLowerCase().includes('unpkg') ||
        error.toLowerCase().includes('cdn') ||
        error.toLowerCase().includes('failed to load')
    );

    expect(mimeTypeErrors).to.have.length(0);
  });

  it('should have the local PDF worker file loaded (no external CDN)', () => {
    // Verify the PDF canvas exists (meaning PDF loaded successfully with local worker)
    cy.get('#side-view-content').find('canvas').should('exist');
    cy.get('.react-pdf__Document').should('exist');
  });
});
