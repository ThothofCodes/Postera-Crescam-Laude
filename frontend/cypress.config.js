import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    viewportWidth: 1280,
    viewportHeight: 800,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    // Video and screenshots for CI
    video: false,
    screenshotOnRunFailure: true,
    // Automatically mock the boot screen so tests start on the actual app
    setupNodeEvents(on, config) {
      // Add custom task for logging
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },
});
