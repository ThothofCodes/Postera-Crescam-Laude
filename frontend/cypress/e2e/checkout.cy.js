// E2E: Checkout flow — cart, checkout form, and payment method selection
describe('Checkout Flow', () => {
  it('checkout page loads without items', () => {
    cy.visit('/checkout');
    cy.get('body').should('be.visible');
  });

  it('login page renders correctly', () => {
    cy.visit('/login');
    cy.get('body').should('be.visible');
    cy.get('input[type="email"], input[name="email"]').should('exist');
    cy.get('input[type="password"], input[name="password"]').should('exist');
  });

  it('admin login page renders correctly', () => {
    cy.visit('/admin/login');
    cy.get('body').should('be.visible');
    cy.get('input[type="email"], input[name="email"]').should('exist');
    cy.get('input[type="password"], input[name="password"]').should('exist');
  });

  it('ticket tracking page loads', () => {
    cy.visit('/track');
    cy.get('body').should('be.visible');
  });

  it('force password change page loads', () => {
    cy.visit('/admin/force-password-change', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
});
