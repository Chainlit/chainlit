describe('Command', () => {
  // Taller viewport reduces header overlap in headless + absolute-positioned menus
  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it('should correctly display commands', () => {
    cy.get(`#chat-input`).type('/sear');
    cy.get('.command-item').should('have.length', 1);
    cy.get('.command-item').eq(0).click();

    cy.get(`#chat-input`).type('Hello{enter}');

    cy.get('.step').should('have.length', 2);
    cy.get('.step').eq(0).find('.command-span').should('have.text', 'Search');

    cy.get('#command-button').should('exist');

    cy.get('.step')
      .eq(1)
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal('Command: Search');
      });

    cy.get(`#chat-input`).type('/pic');
    cy.get('.command-item').should('have.length', 1);
    cy.get('.command-item').eq(0).click();

    cy.get(`#chat-input`).type('Hello{enter}');

    cy.get('.step').should('have.length', 4);
    cy.get('.step').eq(2).find('.command-span').should('have.text', 'Picture');

    // After selecting Picture, backend clears commands -> tools button disappears
    cy.get('#command-button').should('not.exist');
  });

  it('should correctly display and interact with commands', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    // Test 1: Check initial command buttons (now includes Search and StickyButton)
    cy.get('#command-Search').should('exist').and('be.visible');
    cy.get('#command-StickyButton').should('exist').and('be.visible');
    cy.get('#command-Picture').should('not.exist');
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-button').should('exist').and('be.visible');

    // Test 2: Type "/" to show command menu, filter to Picture, select it
    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('have.length.at.least', 3);

    cy.get('#chat-input').type('pic');
    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Picture');
    cy.get('[data-index="0"]').click();

    // Non-button selection shows as a pill; submit with Enter
    cy.get('#chat-input').type('Generate an image{enter}');

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
    cy.wait(500);

    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('have.length.at.least', 3);
    cy.get('[data-index="0"]').should('have.class', 'bg-accent');

    cy.get('#chat-input').type('{downArrow}');
    cy.get('[data-index="1"]').should('have.class', 'bg-accent');

    cy.get('#chat-input').type('{upArrow}');
    cy.get('[data-index="0"]').should('have.class', 'bg-accent');

    cy.get('#chat-input').type('{enter}');
    cy.get('[data-index]').should('not.exist');
    cy.get('[id^="command-"]').should('have.length.at.least', 1);
  });

  it('should handle Tools dropdown menu', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');
    // Non-button commands are listed: Picture, Canvas, Sticky (at least those)
    cy.get('[data-popover-content] [data-index]').should('have.length.at.least', 2);

    cy.get('[data-popover-content]').should('contain', 'Picture');
    cy.get('[data-popover-content]').should('contain', 'Canvas');
    cy.get('[data-popover-content]').should('contain', 'Sticky');

    // Pick Canvas
    cy.get('[data-popover-content] [data-index]').contains('Canvas').click();
    cy.get('#command-Canvas').should('exist').and('be.visible');
    cy.get('#command-button').should('exist');

    cy.get('#chat-input').type('Collaborate on code{enter}');
    cy.get('.step').should('contain', 'Command: Canvas');
  });

  it('should handle button command clicks', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#command-Search').should('exist');
    cy.get('#command-Search').click();

    cy.get('#command-Search').should('satisfy', ($el) => {
      return (
        $el.hasClass('command-selected') ||
        $el.hasClass('text-[#0066FF]') ||
        $el.find('span').hasClass('text-[#0066FF]') ||
        $el.find('.text-\\[\\#0066FF\\]').length > 0
      );
    });

    cy.get('#chat-input').type('Search for chainlit{enter}');
    cy.get('.step').should('contain', 'Command: Search');
    cy.get('#command-Search').should('exist');

    // Deselect and send a no-command message
    cy.get('#command-Search').click();
    cy.get('#chat-input').type('No command message{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should handle escape key to close command menu', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');
    cy.get('[data-index]').should('exist').and('have.length.at.least', 3);

    cy.get('#chat-input').type('{esc}');
    cy.get('[data-index]').should('not.exist');
    cy.get('#chat-input').should('have.value', '/');
  });

  it('should handle command selection via click', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/can');

    cy.get('[data-index]').should('have.length', 1);
    cy.get('[data-index="0"]').should('contain', 'Canvas');
    cy.get('[data-index="0"]').click();

    cy.get('#command-Canvas').should('exist').and('be.visible');
    cy.get('[data-index]').should('not.exist');
    cy.get('#chat-input').invoke('val').should('not.contain', '/can');
  });

  it('should properly handle selected non-button command removal', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');
    cy.get('[data-popover-content] [data-index]').contains('Canvas').click();

    cy.get('#command-Canvas').should('exist').and('be.visible');
    cy.get('#command-Canvas').click(); // deselect
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-button').should('exist');
  });

  it('should handle mouse hover in command menus', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/');

    // Make sure the menu itself is visible & scrolled so items are not covered by the header
    cy.get('.command-menu-animate').should('be.visible').scrollIntoView();
    cy.get('[data-index]').should('have.length.at.least', 3);

    // Ensure the second item is in view, then force the hover (header can overlap in headless)
    cy.get('[data-index="0"]').should('have.class', 'bg-accent');
    cy.get('[data-index="1"]').scrollIntoView().trigger('mousemove', { force: true });
    cy.get('[data-index="1"]').should('have.class', 'bg-accent');
    cy.get('[data-index="0"]').should('not.have.class', 'bg-accent');

    cy.get('[data-index="1"]').trigger('mouseleave', { force: true });
    cy.wait(100);
    cy.get('[data-index="1"]').should('have.class', 'bg-accent');
  });

  it('should filter commands correctly', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#chat-input').click().clear();
    cy.get('#chat-input').type('/pic');

    cy.get('.command-menu-animate [data-index]').should('have.length', 1);
    cy.get('.command-menu-animate [data-index="0"]').should('contain', 'Picture');

    cy.get('#chat-input').clear().type('/can');
    cy.get('.command-menu-animate [data-index]').should('have.length', 1);
    cy.get('.command-menu-animate [data-index="0"]').should('contain', 'Canvas');

    cy.get('#chat-input').clear().type('/xyz');
    cy.get('.command-menu-animate [data-index]').should('not.exist');
  });

  it('should handle Tools dropdown keyboard navigation', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    cy.get('#command-button').should('exist').click();
    cy.get('[data-popover-content]').should('be.visible');
    cy.get('[data-popover-content] [data-index="0"]').should('have.class', 'bg-accent');

    cy.get('[data-popover-content]').type('{downArrow}');
    cy.get('[data-popover-content] [data-index="1"]').should('have.class', 'bg-accent');

    cy.get('[data-popover-content]').type('{upArrow}');
    cy.get('[data-popover-content] [data-index="0"]').should('have.class', 'bg-accent');

    cy.get('[data-popover-content]').type('{enter}');
    cy.get('[data-popover-content]').should('not.exist');
    cy.get(
      '[id^="command-"][id$="icture"], [id^="command-"][id$="anvas"], [id^="command-"][id$="ticky"]'
    ).should('exist');
  });

  it('should handle command persistence correctly (non-button)', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    // Select persistent non-button command via menu
    cy.get('#chat-input').click().clear().type('/sti');
    cy.get('[data-index]').should('have.length.at.least', 1);
    cy.get('[data-index]').contains('Sticky').click();

    // Selected command should appear as a pill
    cy.get('#command-Sticky').should('exist').and('be.visible');

    // Send a message -> command should persist
    cy.get('#chat-input').type('First sticky message{enter}');
    cy.get('.step').last().should('contain', 'Command: Sticky');

    // Next message still uses Sticky without reselecting
    cy.get('#chat-input').type('Second sticky message{enter}');
    cy.get('.step').last().should('contain', 'Command: Sticky');

    // Deselect by clicking the pill and send a message -> no command
    cy.get('#command-Sticky').click();
    cy.get('#chat-input').type('No command now{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should handle command persistence correctly (button)', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    // Select persistent button command
    cy.get('#command-StickyButton').should('exist').click();

    cy.get('#chat-input').type('StickyButton #1{enter}');
    cy.get('.step').last().should('contain', 'Command: StickyButton');

    // Remains selected for subsequent messages
    cy.get('#chat-input').type('StickyButton #2{enter}');
    cy.get('.step').last().should('contain', 'Command: StickyButton');

    // Deselect and verify no command is sent
    cy.get('#command-StickyButton').click();
    cy.get('#chat-input').type('After deselect{enter}');
    cy.get('.step').last().should('contain', 'Command:');
  });

  it('should show commands in correct places', () => {
    cy.visit('/');
    cy.get('#chat-input').should('exist');
    cy.wait(500);

    // Buttons: Search & StickyButton (button=true) visible; non-button are not
    cy.get('#command-Search').should('exist').and('be.visible');
    cy.get('#command-StickyButton').should('exist').and('be.visible');
    cy.get('#command-Picture').should('not.exist');
    cy.get('#command-Canvas').should('not.exist');
    cy.get('#command-Sticky').should('not.exist');

    // Tools menu contains non-button commands
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

    // Inline "/" menu contains all commands
    cy.get('#chat-input').type('/');
    cy.get('.command-menu-animate [data-index]').should('have.length.at.least', 3);

    cy.get('.command-menu-animate').within(() => {
      cy.contains('Picture').should('exist');
      cy.contains('Canvas').should('exist');
      cy.contains('Search').should('exist');
      cy.contains('Sticky').should('exist');
      cy.contains('StickyButton').should('exist');
    });
  });
});
