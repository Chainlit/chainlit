describe("Update Message", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to update a message", () => {
    cy.get(".message").should("have.length", 1);
    cy.get(".message").eq(0).should("contain", "Hello");
    cy.get(".message").eq(0).should("contain", "Hello again!");
  });
});
