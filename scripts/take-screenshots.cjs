const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const META_PATH = path.resolve(__dirname, '../meta');

async function waitForExtensionUI(page) {
  console.log('Waiting for extension UI to appear...');
  await page.waitForSelector('.bma-controls', { timeout: 60000 });
  console.log('Extension UI found!');

  await page.waitForSelector('.bma-stat', { timeout: 120000 });
  console.log('Filter stats loaded!');

  await new Promise((r) => setTimeout(r, 2000));
}

async function takeElementScreenshot(page, selector, outputName, targetWidth, targetHeight) {
  const filePath = path.join(META_PATH, outputName);
  const tempPath = path.join(META_PATH, `_temp_${outputName}`);

  // Use a wide viewport
  await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 500));

  // Screenshot just the element
  const element = await page.$(selector);
  if (!element) {
    console.error(`Element ${selector} not found!`);
    return;
  }

  await element.screenshot({ path: tempPath, type: 'png' });

  // Get element dimensions
  const box = await element.boundingBox();
  const elementWidth = Math.round(box.width);
  const elementHeight = Math.round(box.height);

  // Create the final image with padding/resizing
  // Add dark background padding to reach target size
  const img = sharp(tempPath);

  if (elementWidth >= targetWidth && elementHeight >= targetHeight) {
    // Element is big enough, just resize/crop
    await img.resize(targetWidth, targetHeight, { fit: 'cover', position: 'top' }).toFile(filePath);
  } else {
    // Element is smaller, center it on a dark background
    await img
      .resize(Math.min(elementWidth, targetWidth), Math.min(elementHeight, targetHeight), { fit: 'inside' })
      .extend({
        top: Math.max(0, Math.floor((targetHeight - Math.min(elementHeight, targetHeight)) / 2)),
        bottom: Math.max(0, Math.ceil((targetHeight - Math.min(elementHeight, targetHeight)) / 2)),
        left: Math.max(0, Math.floor((targetWidth - Math.min(elementWidth, targetWidth)) / 2)),
        right: Math.max(0, Math.ceil((targetWidth - Math.min(elementWidth, targetWidth)) / 2)),
        background: { r: 20, g: 20, b: 20, alpha: 1 },
      })
      .toFile(filePath);
  }

  fs.unlinkSync(tempPath);
  console.log(`Saved: ${outputName} (${targetWidth}x${targetHeight}) - focused on extension UI`);
}

async function takeFullPageScreenshot(page, outputName, width, height) {
  const filePath = path.join(META_PATH, outputName);

  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: filePath, type: 'png' });

  console.log(`Saved: ${outputName} (${width}x${height})`);
}

async function main() {
  console.log('Launching Chrome with extension...');
  console.log(`Extension path: ${EXTENSION_PATH}`);

  if (!fs.existsSync(EXTENSION_PATH)) {
    console.error('Extension not built! Run "npm run build" first.');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
    ],
    defaultViewport: null,
  });

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Navigating to Metal Archives...');
    await page.goto('https://www.metal-archives.com/lists/ZA', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    const pageContent = await page.content();
    if (pageContent.includes('Checking your browser') || pageContent.includes('challenge-platform')) {
      console.log('Cloudflare detected. Waiting for it to pass...');
      await new Promise((r) => setTimeout(r, 10000));
    }

    await waitForExtensionUI(page);

    // Click some filters to show the extension in action
    console.log('Applying filters to showcase functionality...');

    // Click "Active" status
    const activeBtn = await page.$('.bma-stat[data-status="Active"]');
    if (activeBtn) {
      await activeBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Click a genre (e.g., "Death")
    const deathGenre = await page.$('.bma-stat[data-genre="Death"]');
    if (deathGenre) {
      await deathGenre.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Take promo images focused on the extension panel
    console.log('\nTaking promo images focused on extension UI...');
    await takeElementScreenshot(page, '.bma-controls', 'promo-small-440x280.png', 440, 280);
    await takeElementScreenshot(page, '.bma-controls', 'promo-marquee-1400x560.png', 1400, 560);

    // Take full page screenshots showing extension in context
    console.log('\nTaking full page screenshots...');
    await takeFullPageScreenshot(page, 'screenshot-1280x800.png', 1280, 800);
    await takeFullPageScreenshot(page, 'screenshot-640x400.png', 640, 400);

    console.log('\nDone! Screenshots saved to:', META_PATH);

    console.log('\nBrowser will stay open for 10 seconds for inspection...');
    await new Promise((r) => setTimeout(r, 10000));
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
