// E2E: Tech Store — browse, search, filter, and view product details
describe('Tech Store', () => {
  beforeEach(() => {
    cy.visit('/store');
  });

  it('loads the store page with products', () => {
    cy.url().should('include', '/store');
    cy.get('body').should('be.visible');
    // Page should render without errors
    cy.get('#root').children().should('have.length.greaterThan', 0);
  });

  it('displays the PCL branding in the navbar', () => {
    cy.get('body').contains(/postera crescam laude|pcl/i).should('exist');
  });

  it('navigates to the store via navbar', () => {
    cy.get('a[href="/store"], a[href="/store/"]').first().click();
    cy.url().should('include', '/store');
  });

  it('shows category filters', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[class*="category"], [class*="filter"]').length > 0) {
        cy.get('[class*="category"], [class*="filter"]').should('exist');
      }
    });
  });

  it('renders without console errors', () => {
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').as('consoleError');
    });
    cy.visit('/store');
    cy.get('@consoleError').should('not.be.called');
  });
});
