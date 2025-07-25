const { connect } = require("puppeteer-real-browser");

let urlQueue = [];
let running = false;
let browser = null;
let page = null;

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

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getHtml(url, waitKey) {
  if (!browser) {
    console.log("connecting to browser");
    const { browser: newBrowser, page: newPage } = await connect({
      headless: false,
      // args: [],
      // customConfig: {},
      // turnstile: true,
      // connectOption: {},
      // disableXvfb: false,
      // ignoreAllFlags: false,
    });
    browser = newBrowser;
    page = newPage;
  }

  console.log("goto", url);
  await page.goto(url);

  // Wait for the specific element to appear
  if (waitKey) {
    try {
      // Wait for the element to be present in the DOM
      await page.waitForSelector(waitKey, { timeout: 30000 }); // 30 second timeout
      console.log(`Element "${waitKey}" found on page`);
    } catch (error) {
      console.log(
        `Element "${waitKey}" not found within timeout, proceeding anyway`
      );
    }
  } else {
    console.log("wait for 30 seconds");
    await waitFor(30000);
    console.log("Network is idle");
  }

  const html = await page.content();
  await page.close(); // Close page instead of browser to reuse browser instance
  return html;
}

module.exports = {
  addUrlToQueue,
};
