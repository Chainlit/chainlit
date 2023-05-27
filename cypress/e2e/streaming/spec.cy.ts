describe("Streaming", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to stream a message", () => {
    const tokenList = ["the", "quick", "brown", "fox"];
    cy.get(".message").should("have.length", 1);

    for (const token of tokenList) {
      cy.get(".message").eq(0).should("contain", token);
    }
    cy.get(".message").eq(0).should("contain", tokenList.join(""));

    cy.wait(2000);
    cy.get(".message").should("have.length", 1);
  });
});
