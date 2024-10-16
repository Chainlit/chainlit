import { runTestServer } from '../../support/testUtils';

describe('dataframe', () => {
  before(() => {
    runTestServer();
  });

  it('should be able to display an inline dataframe', () => {
    // Check if the DataFrame is rendered within the first step
    cy.get('.step').should('have.length', 1);
    cy.get('.step').first().find('.MuiDataGrid-main').should('have.length', 1);

    // Click the sort button in the "Age" column header to sort in ascending order
    cy.get('.MuiDataGrid-columnHeader[aria-label="Age"]')
      .find('button')
      .first()
      .click({ force: true });
    // Verify the first row's "Age" cell contains '25' after sorting
    cy.get('.MuiDataGrid-row')
      .first()
      .find('.MuiDataGrid-cell[data-field="Age"] .MuiDataGrid-cellContent')
      .should('have.text', '25');

    // Click the "Next page" button in the pagination controls
    cy.get('.MuiTablePagination-actions').find('button').eq(1).click();
    // Verify that the next page contains exactly 5 rows
    cy.get('.MuiDataGrid-row').should('have.length', 5);

    // Click the input to open the dropdown
    cy.get('.MuiTablePagination-select').click();
    // Select the option with the value '50' from the dropdown list
    cy.get('ul.MuiMenu-list li').contains('50').click();
    // Scroll to the bottom of the virtual scroller in the MUI DataGrid
    cy.get('.MuiDataGrid-virtualScroller').scrollTo('bottom');
    // Check that tha last name is Olivia
    cy.get('.MuiDataGrid-row')
      .last()
      .find('.MuiDataGrid-cell[data-field="Name"] .MuiDataGrid-cellContent')
      .should('have.text', 'Olivia');
  });
});
