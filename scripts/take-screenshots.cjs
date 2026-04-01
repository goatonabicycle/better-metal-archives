const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const EXTENSION_PATH = path.resolve(__dirname, '../.output/chrome-mv3');
const META_PATH = path.resolve(__dirname, '../meta');

async function takeScreenshot(page, name, width, height, cropOptions) {
  const tempPath = path.join(META_PATH, `_temp_${name}`);
  const filePath = path.join(META_PATH, name);

  await page.setViewport({ width: 1600, height: 1000, deviceScaleFactor: 1 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: tempPath, type: 'png' });

  await sharp(tempPath)
    .extract({
      left: cropOptions.left || 180,
      top: cropOptions.top || 70,
      width: cropOptions.width || 1200,
      height: cropOptions.height || 750,
    })
    .resize(width, height, { fit: 'fill' })
    .toFile(filePath);

  fs.unlinkSync(tempPath);
  console.log(`Saved: ${name}`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
    ],
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  console.log('Navigating...');
  await page.goto('https://www.metal-archives.com/lists/ZA', { waitUntil: 'networkidle2', timeout: 120000 });

  // One patient wait for Cloudflare + extension
  console.log('Waiting for page and extension to load...');
  await page.waitForSelector('.bma-controls', { timeout: 120000 });
  await page.waitForSelector('.bma-stat', { timeout: 60000 });
  console.log('Ready!');

  // 1. FILTERING
  console.log('\n1. Filtering screenshot...');
  await page.click('.bma-stat[data-status="active"]');
  await new Promise(r => setTimeout(r, 500));
  await page.click('.bma-stat[data-genre="Death"]');
  await new Promise(r => setTimeout(r, 1000));
  await takeScreenshot(page, 'upload_filtering_1280x800.png', 1280, 800, {});
  await takeScreenshot(page, 'upload_filtering_640x400.png', 640, 400, {});

  // 2. HOVER on Vulvodynia
  console.log('\n2. Hover screenshot (Vulvodynia)...');
  // Clear filters
  await page.evaluate(() => document.querySelector('.bma-clear-btn')?.click());
  await new Promise(r => setTimeout(r, 1000));

  // Type in search box
  const searchInput = await page.$('#bma-filter-input');
  if (searchInput) {
    await searchInput.click();
    await searchInput.type('Vulvodynia', { delay: 50 });
    await new Promise(r => setTimeout(r, 1500));
  }

  // Debug: check what's visible
  const visible = await page.evaluate(() => {
    const links = document.querySelectorAll('.bma-results-container a[href*="/bands/"]');
    return Array.from(links).slice(0, 3).map(a => a.textContent);
  });
  console.log('Visible bands:', visible);

  const bandLink = await page.$('.bma-results-container a[href*="/bands/"]');
  if (bandLink) {
    const name = await page.evaluate(el => el.textContent, bandLink);
    console.log(`Hovering over: ${name}`);
    await bandLink.hover();
    await page.waitForSelector('.bma-preview-genre', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot(page, 'upload_hover_1280x800.png', 1280, 800, {});
    await takeScreenshot(page, 'upload_hover_640x400.png', 640, 400, {});
  } else {
    console.log('No band found!');
  }
  await page.mouse.move(0, 0);

  // 3. RELEASES
  console.log('\n3. Releases screenshot...');
  await page.evaluate(() => document.querySelector('.bma-tab:last-child')?.click());
  await page.waitForSelector('.bma-releases-container', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.evaluate(() => {
    const sel = document.querySelector('#bma-releases-year');
    if (sel) { sel.value = '2025'; sel.dispatchEvent(new Event('change', { bubbles: true })); }
  });
  await new Promise(r => setTimeout(r, 8000));
  await takeScreenshot(page, 'upload_releases_1280x800.png', 1280, 800, {});
  await takeScreenshot(page, 'upload_releases_640x400.png', 640, 400, {});

  // 4. PROMO
  console.log('\n4. Promo images...');
  await page.evaluate(() => document.querySelector('.bma-tab:first-child')?.click());
  await new Promise(r => setTimeout(r, 1000));
  await takeScreenshot(page, 'upload_1400x560.png', 1400, 560, { height: 520 });
  await takeScreenshot(page, 'upload_440x280.png', 440, 280, { width: 900, height: 500 });

  console.log('\nDone! Browser stays open for 30s...');
  await new Promise(r => setTimeout(r, 30000));
  await browser.close();
}

main().catch(console.error);
