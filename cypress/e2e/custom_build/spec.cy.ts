describe('Custom Build', () => {
  it('should correctly serve the custom build page', () => {
    cy.get('body').contains(
      'This is a test page for custom build configuration.'
    );
  });
});
