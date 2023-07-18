describe("Custom Header", () => {
  before(() => {
    cy.visit("http://127.0.0.1:8000", {
      headers: { "test-header": "test header value" },
    });
  });

  it("should have access to custom headers", () => {
    cy.get(".message")
      .should("have.length", 1)
      .eq(0)
      .should("contain", "test header value");
  });
});
