// Custom Cypress commands for PCL e2e testing

Cypress.Commands.add('loginAdmin', (email, password) => {
  cy.visit('/admin/login');
  cy.get('input[type="email"], input[name="email"]').first().type(email);
  cy.get('input[type="password"], input[name="password"]').first().type(password);
  cy.get('button[type="submit"], button').contains(/sign in|login|log in/i).click();
  cy.url().should('not.include', '/admin/login');
});

Cypress.Commands.add('loginUser', (email, password) => {
  cy.visit('/login');
  cy.get('input[type="email"], input[name="email"]').first().type(email);
  cy.get('input[type="password"], input[name="password"]').first().type(password);
  cy.get('button[type="submit"], button').contains(/sign in|login|log in/i).click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('addToCart', (productName) => {
  cy.contains(productName).scrollIntoView();
  cy.contains(productName).closest('[class*="card"], [class*="product"]').within(() => {
    cy.get('button').contains(/add|cart/i).click();
  });
});
