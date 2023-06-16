describe("Upload multiple files", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to receive two files", () => {
    cy.get("#upload-button").should("exist");

    cy.fixture("state_of_the_union.txt", "utf-8").as("txtFile");
    cy.fixture("hello.py", "utf-8").as("pyFile");

    cy.get("input[type=file]").selectFile(["@txtFile", "@pyFile"], {
      force: true,
    });

    // Sometimes the loading indicator is not shown because the file upload is too fast
    // cy.get("#upload-button-loading").should("exist");
    // cy.get("#upload-button-loading").should("not.exist");

    cy.get(".message")
      .eq(1)
      .should("contain", "2 files uploaded: state_of_the_union.txt,hello.py");

    cy.get("#upload-button").should("not.exist");
  });
});
