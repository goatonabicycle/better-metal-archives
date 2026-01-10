import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Better Metal Archives',
    description: 'Filter Metal Archives by genre, location, and status. Hover over any band for a quick preview.',
    version: '1.0.0',
  },
  runner: {
    startUrls: ['https://www.metal-archives.com/lists/US'],
    chromiumArgs: ['--disable-blink-features=AutomationControlled'],
  },
});
