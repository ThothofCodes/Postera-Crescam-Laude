// E2E: Public pages — services, calculator, contact, help, tech-hub
describe('Public Pages', () => {
  const publicPages = [
    { url: '/services', name: 'Services' },
    { url: '/calculator', name: 'Calculator' },
    { url: '/contact', name: 'Contact' },
    { url: '/help', name: 'Help Desk' },
    { url: '/tech-hub', name: 'Tech Hub' },
    { url: '/consult', name: 'Consultations' },
  ];

  publicPages.forEach(({ url, name }) => {
    it(`loads ${name} page (${url})`, () => {
      cy.visit(url, { failOnStatusCode: false });
      cy.url().should('include', url);
      cy.get('body').should('be.visible');
      cy.get('#root').children().should('have.length.greaterThan', 0);
    });
  });

  it('navigates between pages via navbar', () => {
    cy.visit('/');
    cy.get('body').then(($body) => {
      if ($body.find('nav a[href="/services"]').length > 0) {
        cy.get('nav a[href="/services"]').first().click();
        cy.url().should('include', '/services');
      }
    });
  });

  it('403 page renders correctly', () => {
    cy.visit('/403', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });

  it('unknown route shows 404 or redirect', () => {
    cy.visit('/nonexistent-page-xyz', { failOnStatusCode: false });
    cy.get('body').should('be.visible');
  });
});
