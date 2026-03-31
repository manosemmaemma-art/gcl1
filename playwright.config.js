// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',

  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 4,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'off',
  },

  projects: [
    {
      name: 'iphone13',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        browserName: 'chromium',
      },
    },
  ],

  webServer: {
    command: 'node serve.js',
    port: 3000,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
