describe('PDF Viewer (PDFjs)', () => {
  beforeEach(() => {
    cy.intercept('GET', 'https://unpkg.com/**').as('cdnWorker');
  });

  it('should render an inline PDFjs thumbnail', () => {
    cy.get('.step').eq(0).find('.inline-pdfjs').should('have.length', 1);
  });

  it('should auto-open the side panel for a side-display PDFjs element', () => {
    cy.get('#side-view-title').should('exist');
    cy.get('#side-view-content').should('exist');
    cy.get('#side-view-content').find('.side-pdfjs').should('have.length', 1);
  });

  it('should open the fullscreen modal when clicking an inline PDFjs thumbnail', () => {
    cy.get('.step').eq(0).find('.inline-pdfjs').click();
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').find('canvas').should('exist');
    cy.get('[role="dialog"]').find('button[aria-label="Close"]').click();
    cy.get('[role="dialog"]').should('not.exist');
  });

  it('should load PDF without MIME type or CDN errors', () => {
    cy.get('#side-view-content').find('canvas').should('exist');

    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType(
        'resource'
      ) as PerformanceResourceTiming[];
      const pdfResources = resources.filter(
        (r) =>
          r.name.endsWith('.pdf') ||
          r.name.includes('/files/') ||
          r.name.includes('/project/file/')
      );
      expect(
        pdfResources.length,
        'at least one PDF resource should have been loaded'
      ).to.be.greaterThan(0);
      pdfResources.forEach((r) => {
        expect(
          r.duration,
          `PDF resource ${r.name} should load without errors`
        ).to.be.greaterThan(0);
      });
    });
  });

  it('should have the local PDF worker file loaded (no external CDN)', () => {
    cy.get('#side-view-content').find('canvas').should('exist');
    cy.get('.react-pdf__Document').should('exist');

    cy.get('@cdnWorker.all').should('have.length', 0);
  });
});
