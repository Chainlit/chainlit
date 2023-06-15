describe("Upload file", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to receive and decode files", () => {
    cy.get("#upload-button").should("exist");

    // Upload a text file
    cy.fixture("state_of_the_union.txt", "utf-8").as("txtFile");
    cy.get("input[type=file]").selectFile("@txtFile", { force: true });

    // Sometimes the loading indicator is not shown because the file upload is too fast
    // cy.get("#upload-button-loading").should("exist");
    // cy.get("#upload-button-loading").should("not.exist");

    cy.get(".message")
      .eq(1)
      .should(
        "contain",
        "Text file state_of_the_union.txt uploaded, it contains"
      );

    cy.get("#upload-button").should("exist");

    // Expecting a python file, cpp file upload should be rejected
    cy.fixture("hello.cpp", "utf-8").as("cppFile");
    cy.get("input[type=file]").selectFile("@cppFile", { force: true });

    cy.get(".message").should("have.length", 3);

    // Upload a python file
    cy.fixture("hello.py", "utf-8").as("pyFile");
    cy.get("input[type=file]").selectFile("@pyFile", { force: true });

    cy.get(".message")
      .should("have.length", 4)
      .eq(3)
      .should("contain", "Python file hello.py uploaded, it contains");

    cy.get("#upload-button").should("not.exist");
  });
});
