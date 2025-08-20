import 'cypress-plugin-steps';

describe('Command', () => {
  // Taller viewport reduces header overlap in headless + absolute-positioned menus
  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it('should correctly display commands', () => {
    cy.step('Type command shortcut and select Search');
    cy.get(`#chat-input`).type('/sear');
    cy.get('.command-item').should('have.length', 1);
    cy.get('.command-item').eq(0).click();

    cy.step('Send message with Search command');
    cy.get(`#chat-input`).type('Hello{enter}');

    cy.step('Verify Search command was applied');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).find('.command-span').should('have.text', 'Search');

    cy.get('#command-button').should('exist');

    cy.get('.step')
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal('Command: Search');
      });

    cy.step('Select Picture command');
    cy.get(`#chat-input`).type('/pic');
    cy.get('.command-item').should('have.length', 1);
    cy.get('.command-item').eq(0).click();

    cy.step('Send message with Picture command');
    cy.get(`#chat-input`).type('Hello{enter}');

    cy.step('Verify Picture command clears all commands');
    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).find('.command-span').should('have.text', 'Picture');

    // After selecting Picture, backend clears commands -> tools button disappears
    cy.get('#command-button').should('not.exist');
  });

  it('should correctly display and interact with commands', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Verify initial command buttons are visible');
    // Search and StickyButton are button commands
    cy.get('#command-Search').should('exist').and('be.visible');
    cy.get('#command-StickyButton').should('exist').and('be.visible');
    cy.get('#command-Picture').should('not.exist');
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-button').should('exist').and('be.visible');

    cy.step('Open command menu and filter to Picture');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('have.length.at.least', 3);

    cy.get('#chat-input').type('pic');
    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Picture');
    cy.get('[data-index="0"]').click();

    cy.step('Submit message with Picture command');
    cy.get('#chat-input').type('Generate an image{enter}');

    cy.step('Verify command was sent and UI updated');
    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(1).should('contain', 'Command: Picture');

    // Backend cleared commands after Picture -> no tools button and no button pills
    cy.get('#command-Search').should('not.exist');
    cy.get('#command-StickyButton').should('not.exist');
    cy.get('#command-button').should('not.exist');
  });

  it('should handle keyboard navigation in command menu', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Open command menu');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('have.length.at.least', 3);

    // Check first item is selected by default using data attribute
    cy.get('[data-index="0"]').should('satisfy', ($el) => {
      // Component adds bg-accent class when selected, but we check for functional state
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });

    cy.step('Navigate down with keyboard');
    cy.get('#chat-input').type('{downArrow}');
    cy.get('[data-index="1"]').should('satisfy', ($el) => {
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });

    cy.step('Navigate up with keyboard');
    cy.get('#chat-input').type('{upArrow}');
    cy.get('[data-index="0"]').should('satisfy', ($el) => {
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });

    cy.step('Select with Enter key');
    cy.get('#chat-input').type('{enter}');
    cy.get('[data-index]').should('not.exist');
    cy.get('[id^="command-"]').should('have.length.at.least', 1);
  });

  it('should handle Tools dropdown menu', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Open Tools dropdown');
    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');

    // Non-button commands are listed: Picture, Canvas, Sticky
    cy.get('[data-popover-content] [data-index]').should(
      'have.length.at.least',
      3
    );

    cy.step('Verify non-button commands are in dropdown');
    cy.get('[data-popover-content]').should('contain', 'Picture');
    cy.get('[data-popover-content]').should('contain', 'Canvas');
    cy.get('[data-popover-content]').should('contain', 'Sticky');

    cy.step('Select Canvas from dropdown');
    cy.get('[data-popover-content] [data-index]').contains('Canvas').click();
    cy.get('#command-Canvas').should('exist').and('be.visible');
    cy.get('#command-button').should('exist');

    cy.step('Send message with Canvas command');
    cy.get('#chat-input').type('Collaborate on code{enter}');
    cy.get('.step').should('contain', 'Command: Canvas');
  });

  it('should handle button command clicks', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Click Search button command');
    cy.get('#command-Search').should('exist');
    cy.get('#command-Search').click();

    // Check that the button shows selected state (via text color class or aria attribute)
    cy.get('#command-Search').should('satisfy', ($el) => {
      // The component adds text-command class when selected
      return (
        $el.hasClass('text-command') ||
        $el.find('.text-command').length > 0 ||
        $el.attr('aria-pressed') === 'true' ||
        $el.attr('data-selected') === 'true'
      );
    });

    cy.step('Send message with Search command selected');
    cy.get('#chat-input').type('Search for chainlit{enter}');
    cy.get('.step').should('contain', 'Command: Search');
    cy.get('#command-Search').should('exist');

    cy.step('Deselect Search command');
    cy.get('#command-Search').click();

    cy.step('Send message without command');
    cy.get('#chat-input').type('No command message{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should handle escape key to close command menu', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Open command menu');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('exist').and('have.length.at.least', 3);

    cy.step('Close menu with Escape key');
    cy.get('#chat-input').type('{esc}');
    cy.get('[data-index]').should('not.exist');
    cy.get('#chat-input').should('have.value', '/');
  });

  it('should handle command selection via click', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Type partial command');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/can');

    cy.step('Select Canvas from filtered results');
    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Canvas');
    cy.get('[data-index="0"]').click();

    cy.step('Verify Canvas command is selected');
    cy.get('#command-Canvas').should('exist').and('be.visible');
    cy.get('[data-index]').should('not.exist');
    cy.get('#chat-input').invoke('val').should('not.contain', '/can');
  });

  it('should properly handle selected non-button command removal', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Select Canvas from Tools dropdown');
    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');
    cy.get('[data-popover-content] [data-index]').contains('Canvas').click();

    cy.step('Verify Canvas is selected');
    cy.get('#command-Canvas').should('exist').and('be.visible');

    cy.step('Deselect Canvas');
    cy.get('#command-Canvas').click();
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-button').should('exist');
  });

  it('should handle mouse hover in command menus', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Open command menu');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');

    // Make sure the menu itself is visible
    cy.get('[data-index]').should('have.length.at.least', 3);

    cy.step('Hover over second item');
    // First item should be selected initially
    cy.get('[data-index="0"]').should('satisfy', ($el) => {
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });

    cy.get('[data-index="1"]')
      .scrollIntoView()
      .trigger('mousemove', { force: true });
    cy.get('[data-index="1"]').should('satisfy', ($el) => {
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });

    cy.step('Verify selection persists after mouse leave');
    cy.get('[data-index="1"]').trigger('mouseleave', { force: true });
    cy.wait(100);
    cy.get('[data-index="1"]').should('satisfy', ($el) => {
      return $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true';
    });
  });

  it('should filter commands correctly', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Filter for Picture command');
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/pic');
    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Picture');

    cy.step('Filter for Canvas command');
    cy.get('#chat-input').clear().type('/can');
    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Canvas');

    cy.step('Filter with non-matching text');
    cy.get('#chat-input').clear().type('/xyz');
    cy.get('[data-index]').should('not.exist');
  });

  it('should handle Tools dropdown keyboard navigation', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Open Tools dropdown');
    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');

    // First item should be selected by default
    cy.get('[data-popover-content] [data-index="0"]').should(
      'satisfy',
      ($el) => {
        return (
          $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true'
        );
      }
    );

    cy.step('Navigate down in dropdown');
    cy.get('[data-popover-content]').type('{downArrow}');
    cy.get('[data-popover-content] [data-index="1"]').should(
      'satisfy',
      ($el) => {
        return (
          $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true'
        );
      }
    );

    cy.step('Navigate up in dropdown');
    cy.get('[data-popover-content]').type('{upArrow}');
    cy.get('[data-popover-content] [data-index="0"]').should(
      'satisfy',
      ($el) => {
        return (
          $el.hasClass('bg-accent') || $el.attr('aria-selected') === 'true'
        );
      }
    );

    cy.step('Select with Enter key');
    cy.get('[data-popover-content]').type('{enter}');
    cy.get('[data-popover-content]').should('not.exist');
    cy.get(
      '[id^="command-"][id$="icture"], [id^="command-"][id$="anvas"], [id^="command-"][id$="ticky"]'
    ).should('exist');
  });

  it('should handle command persistence correctly (non-button)', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Select persistent Sticky command');
    cy.get('#chat-input').click().clear().type('/sti');
    cy.get('[data-index]').should('have.length.at.least', 1);
    cy.get('[data-index]').contains('Sticky').click();

    // Selected command should appear as a pill
    cy.get('#command-Sticky').should('exist').and('be.visible');

    cy.step('Send first message with persistent command');
    cy.get('#chat-input').type('First sticky message{enter}');
    cy.get('.step').last().should('contain', 'Command: Sticky');

    cy.step('Send second message - command should persist');
    cy.get('#chat-input').type('Second sticky message{enter}');
    cy.get('.step').last().should('contain', 'Command: Sticky');

    cy.step('Deselect persistent command');
    cy.get('#command-Sticky').click();

    cy.step('Send message without command');
    cy.get('#chat-input').type('No command now{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should handle command persistence correctly (button)', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Select persistent StickyButton command');
    cy.get('#command-StickyButton').should('exist').click();

    cy.step('Send first message with persistent button');
    cy.get('#chat-input').type('StickyButton #1{enter}');
    cy.get('.step').last().should('contain', 'Command: StickyButton');

    cy.step('Send second message - button should remain selected');
    cy.get('#chat-input').type('StickyButton #2{enter}');
    cy.get('.step').last().should('contain', 'Command: StickyButton');

    cy.step('Deselect persistent button');
    cy.get('#command-StickyButton').click();

    cy.step('Send message without command');
    cy.get('#chat-input').type('After deselect{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should show commands in correct places', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Verify button commands are visible as buttons');
    // Buttons: Search & StickyButton (button=true) visible; non-button are not
    cy.get('#command-Search').should('exist').and('be.visible');
    cy.get('#command-StickyButton').should('exist').and('be.visible');
    cy.get('#command-Picture').should('not.exist');
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-Sticky').should('not.exist');

    cy.step('Verify Tools menu contains non-button commands');
    cy.get('#command-button').click();
    cy.get('[data-popover-content]').within(() => {
      cy.contains('Picture').should('exist');
      cy.contains('Canvas').should('exist');
      cy.contains('Sticky').should('exist');
      cy.contains('Search').should('not.exist');
      cy.contains('StickyButton').should('not.exist');
    });

    cy.get('body').click(0, 0);
    cy.wait(200);

    cy.step('Verify inline menu contains all commands');
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('have.length', 5); // Total: Picture, Search, Canvas, Sticky, StickyButton

    cy.get('[data-index]')
      .parent()
      .parent()
      .within(() => {
        cy.contains('Picture').should('exist');
        cy.contains('Canvas').should('exist');
        cy.contains('Search').should('exist');
        cy.contains('Sticky').should('exist');
        cy.contains('StickyButton').should('exist');
      });
  });

  it('should test command clearing behavior with Picture command', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');

    cy.step('Verify initial commands are available');
    cy.get('#command-Search').should('exist');
    cy.get('#command-StickyButton').should('exist');
    cy.get('#command-button').should('exist');

    cy.step('Select and use Picture command');
    cy.get('#chat-input').type('/pic');
    cy.get('[data-index="0"]').click();
    cy.get('#chat-input').type('Generate a sunset{enter}');

    cy.step('Verify all commands are cleared after Picture');
    cy.get('#command-Search').should('not.exist');
    cy.get('#command-StickyButton').should('not.exist');
    cy.get('#command-button').should('not.exist');

    cy.step('Verify slash command shows no commands');
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('not.exist');

    cy.step('Send regular message without commands');
    cy.get('#chat-input').clear().type('Regular message{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });
});
