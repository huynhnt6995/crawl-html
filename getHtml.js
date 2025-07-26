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

function waitFor(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getHtml(url, waitKey) {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--no-sandbox",
        "--profile-directory=Profile 1",
        "--disable-setuid-sandbox",
        "--use-gl=egl",
      ],
      userDataDir: "/home/ubuntu/.config/chromium",
    });
  }

  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.evaluateOnNewDocument(() => {
    // Patch navigator.plugins
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        { name: "Chrome PDF Plugin" },
        { name: "Chrome PDF Viewer" },
        { name: "Native Client" },
      ],
    });

    // Patch navigator.platform
    Object.defineProperty(navigator, "platform", {
      get: () => "Linux x86_64",
    });

    // Patch Canvas fingerprint
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const ctx = this.getContext("2d");
      ctx.fillStyle = "rgb(100,100,100)";
      ctx.fillRect(0, 0, 10, 10);
      return toDataURL.apply(this, args);
    };
  });

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
