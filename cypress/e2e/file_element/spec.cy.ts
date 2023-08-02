describe("file", () => {
  before(() => {
    cy.intercept("/project/settings").as("settings");
    cy.visit("http://127.0.0.1:8000");
    cy.wait(["@settings"]);
  });

  it("should be able to display a file element", () => {
    cy.get("#welcome-screen").should("exist");

    cy.get(".message").should("have.length", 1);
    cy.get(".message").eq(0).find(".inline-file").should("have.length", 4);

    cy.get("a.inline-file").eq(0).should("have.attr", "download", "example.mp4");
    cy.get("a.inline-file").eq(1).should("have.attr", "download", "cat.jpeg");
    cy.get("a.inline-file").eq(2).should("have.attr", "download", "hello.py");
    cy.get("a.inline-file").eq(3).should("have.attr", "download", "example.mp3");
  });
});
