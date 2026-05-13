// Shared Puppeteer launcher. Uses bundled Chromium.
import puppeteer from 'puppeteer';

let browserPromise = null;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--lang=en-US',
      ],
    });
  }
  return browserPromise;
}

export async function newPage() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 850 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  // Mask common automation signals
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });
  return page;
}

export async function closeBrowser() {
  if (browserPromise) {
    const b = await browserPromise;
    browserPromise = null;
    await b.close();
  }
}
