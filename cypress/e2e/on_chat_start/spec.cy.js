'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
var testUtils_1 = require('../../support/testUtils');
describe('on_chat_start', function () {
  before(function () {
    (0, testUtils_1.runTestServer)();
  });
  it('should correctly run on_chat_start', function () {
    var messages = cy.get('.step');
    messages.should('have.length', 1);
    messages.eq(0).should('contain.text', 'Hello!');
    messages.eq(0).should('contain.html', '<code class="language-python hljs"');
  });
});
