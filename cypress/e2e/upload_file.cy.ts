const path = require("path");

describe("Upload file", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should work locally", () => {
    cy.get("input[type=file]").selectFile(
      path.join(__dirname, "state_of_the_union.txt"),
      { force: true }
    );

    const messages = cy.get(".message");
    messages.should("have.length", 2);

    messages
      .eq(1)
      .should(
        "contain",
        "state_of_the_union.txt uploaded, it contains 38539 characters!"
      );
  });
});
