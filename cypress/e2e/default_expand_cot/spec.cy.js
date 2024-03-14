'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('Default Expand', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should be able to set the default_expand_messages field in the config to have the CoT expanded by default', function () {
    (0, testUtils_1.submitMessage)('Hello');
    cy.get(".step:contains('Hello')").contains('Response from tool 1');
    cy.get(".step:contains('Response from tool 1')").contains(
      'Response from tool 2'
    );
    cy.get(".step:contains('Hello')").contains('Response from tool 3');
    cy.get(".step:contains('Final response')");
  });
});
