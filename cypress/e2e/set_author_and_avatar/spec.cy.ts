import { submitMessage } from '../../support/testUtils';

describe('Set Author and Avatar', () => {
  beforeEach(() => {
    // Visit the test app and wait for welcome message
    cy.visit('/');
    cy.get('.step').should('have.length', 1);
    cy.get('.step')
      .eq(0)
      .should('contain', 'Welcome to the set_author_and_avatar test app!');
  });

  it('should change message author only', () => {
    // Send command to test author change
    submitMessage('test author');

    // Should have: welcome + user message + original message + success message
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).should('contain', 'Original message from Assistant');
    cy.get('.step')
      .eq(3)
      .should('contain', "✅ Author changed to 'Dr. Watson'");

    // Verify the original message now shows the new author in tooltip
    cy.get('.step').eq(2).find('.ai-message span').first().trigger('mouseover');
    cy.contains('Dr. Watson').should('be.visible');
  });

  it('should change message avatar only', () => {
    // Send command to test avatar change
    submitMessage('test avatar');

    // Should have: welcome + user message + original message + success message
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).should('contain', 'Original message from Bob');
    cy.get('.step').eq(3).should('contain', "✅ Avatar changed to 'robot'");

    // Verify the original message now uses the robot avatar
    cy.get('.step')
      .eq(2)
      .find('img')
      .should('have.attr', 'src')
      .and('include', '/avatars/robot');
  });

  it('should change both author and avatar', () => {
    // Send command to test both author and avatar change
    submitMessage('test both');

    // Should have: welcome + user message + original message + success message
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).should('contain', 'Original message from Helper');
    cy.get('.step')
      .eq(3)
      .should(
        'contain',
        "✅ Changed author to 'Sherlock Holmes' and avatar to 'detective'"
      );

    // Verify the original message shows both changes
    cy.get('.step')
      .eq(2)
      .find('img')
      .should('have.attr', 'src')
      .and('include', '/avatars/detective');
    cy.get('.step').eq(2).find('.ai-message span').first().trigger('mouseover');
    cy.contains('Sherlock Holmes').should('be.visible');
  });

  it('should handle avatar names with file extensions', () => {
    // Send command to test extension stripping
    submitMessage('test extension');

    // Should have: welcome + user message + original message + success message
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).should('contain', 'Original message from Researcher');
    cy.get('.step')
      .eq(3)
      .should(
        'contain',
        "✅ Avatar changed to 'scientist.png' (extension should be stripped to 'scientist')"
      );

    // Verify the avatar URL doesn't include the extension
    cy.get('.step')
      .eq(2)
      .find('img')
      .should('have.attr', 'src')
      .and('include', '/avatars/scientist');
    cy.get('.step')
      .eq(2)
      .find('img')
      .should('have.attr', 'src')
      .and('not.include', '.png');
  });

  it('should work with messages created with custom avatar metadata', () => {
    // Send command to test initial avatar metadata
    submitMessage('test metadata');

    // Should have: welcome + user message + test message + success message
    cy.get('.step').should('have.length', 4);
    cy.get('.step')
      .eq(2)
      .should('contain', 'Message created with custom avatar metadata');
    cy.get('.step')
      .eq(3)
      .should(
        'contain',
        "✅ Message created with avatarName='robot' in metadata"
      );

    // Verify the test message uses the robot avatar from metadata (this is the main test)
    cy.get('.step')
      .eq(2)
      .find('img')
      .should('have.attr', 'src')
      .and('include', '/avatars/robot');
  });
});
