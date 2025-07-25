const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

let urlQueue = [];
let running = false;
let browser = null;

async function addUrlToQueue(url, callbackUrl, waitKey) {
  urlQueue.push({ url, callbackUrl, waitKey });
  if (!running) {
    running = true;
    while (urlQueue.length > 0) {
      const { url, callbackUrl, waitKey } = getUrlFromQueue();
      const html = await getHtml(url, waitKey);

      if (callbackUrl) {
        await fetch(callbackUrl, {
          method: "POST",
          body: JSON.stringify({ html }),
        });
      } else {
        console.log(html);
      }
    }
    running = false;
  }
}

function getUrlFromQueue() {
  return urlQueue.shift();
}

async function getHtml(url, waitKey) {
  if (!browser) {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox']
    });
  }

  const page = await browser.newPage();
  await page.goto(url);
  
  // Wait for the specific element to appear
  if (waitKey) {
    try {
      // Wait for the element to be present in the DOM
      await page.waitForSelector(waitKey, { timeout: 30000 }); // 30 second timeout
      console.log(`Element "${waitKey}" found on page`);
    } catch (error) {
      console.log(`Element "${waitKey}" not found within timeout, proceeding anyway`);
    }
  } else {
    await page.waitForNetworkIdle({ timeout: 10000, idleTime: 500 });
    console.log('Network is idle');
  }
  
  const html = await page.content();
  await page.close(); // Close page instead of browser to reuse browser instance
  return html;
}

module.exports = {
  addUrlToQueue,
};
