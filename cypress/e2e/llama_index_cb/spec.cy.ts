function testPlayground(index, shouldContain: string) {
  cy.get(".playground-button").eq(index).should("exist").click();

  cy.get("#playground")
    .should("exist")
    .get("[contenteditable=true]")
    .should("exist")
    .should("contain", shouldContain);

  cy.get("#playground").get("#close-playground").should("exist").click();
}

describe("Llama Index Callback", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to send messages to the UI with prompts and elements", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);

    cy.get("#llm-done").should("exist").click();

    cy.get(".message").should("have.length", 3);

    cy.get(".message")
      .eq(1)
      .find(".element-link")
      .eq(0)
      .should("contain", "Source 0");

    testPlayground(0, "This is the LLM prompt\nThis is the LLM response");
  });
});
