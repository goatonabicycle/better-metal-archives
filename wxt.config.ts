import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Better Metal Archives',
    description: 'Enhancements for Metal Archives',
    version: '0.1.0',
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['https://www.metal-archives.com/*'],
      },
    ],
  },
  runner: {
    startUrls: ['https://www.metal-archives.com/'],
    chromiumArgs: ['--disable-blink-features=AutomationControlled'],
  },
});
