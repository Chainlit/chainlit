import { runTestServer } from "../../support/testUtils";

describe("Upload file", () => {
  before(() => {
    runTestServer();
  });

  it("should be able to upload and decode files", () => {
    cy.get("#upload-button").should("exist");

    // Upload a text file
    cy.fixture("state_of_the_union.txt", "utf-8").as("txtFile");
    cy.get("input[type=file]").selectFile("@txtFile", { force: true });

    cy.get(".message")
      .eq(1)
      .should("contain", "state_of_the_union.txt uploaded, it contains");

    // Expecting a python file, cpp file upload should be rejected
    cy.fixture("hello.cpp", "utf-8").as("cppFile");
    cy.get("input[type=file]").selectFile("@cppFile", { force: true });

    // Upload a python file
    cy.fixture("hello.py", "utf-8").as("pyFile");
    cy.get("input[type=file]").selectFile("@pyFile", { force: true });

    cy.get(".message")
      .eq(2)
      .should("contain", "hello.py uploaded, it contains");
  });
});
