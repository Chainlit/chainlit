describe("Custom Route", () => {
  before(() => {
    cy.visit("http://127.0.0.1:8000/hello");
  });

  it("should correctly serve the custom route", () => {
    cy.get("body").contains("Hello World");
  });
});
