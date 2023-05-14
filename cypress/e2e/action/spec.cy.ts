describe("Action", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.intercept("/message").as("message");
    cy.intercept("/action").as("action");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should correcly execute the action", () => {
    cy.get(".message").should("have.length", 1);
    cy.get("#action-action1").should("exist");
    cy.get("#action-action1").click();
    cy.wait(["@action"]);
    const messages = cy.get(".message");
    messages.should("have.length", 2);

    messages.eq(1).should("contain", "Executed action 1!");
  });
});
