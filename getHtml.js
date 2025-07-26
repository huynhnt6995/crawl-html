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
          "--disable-blink-features=AutomationControlled",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-images",
          "--disable-javascript",
          "--disable-background-networking",
          "--disable-sync",
          "--disable-translate",
          "--hide-scrollbars",
          "--mute-audio",
          "--no-default-browser-check",
          "--safebrowsing-disable-auto-update",
          "--ignore-certificate-errors",
          "--ignore-ssl-errors",
          "--ignore-certificate-errors-spki-list",
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ],
        userDataDir: "/home/ubuntu/.config/chromium",
        ignoreDefaultArgs: ['--enable-automation'],
      });
    }

  const page = await browser.newPage();
  
  // Remove webdriver property
  await page.evaluateOnNewDocument(() => {
    delete navigator.__proto__.webdriver;
  });
  
  // Set realistic viewport
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });
  
  // Set extra headers to look more human
  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  });

  await page.evaluateOnNewDocument(() => {
    // 1. Patch WebGL Vendor & Renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return "Intel Inc."; // UNMASKED_VENDOR_WEBGL
      if (parameter === 37446) return "Intel Iris OpenGL"; // UNMASKED_RENDERER_WEBGL
      return getParameter.call(this, parameter);
    };

    // 2. Patch navigator.plugins (giả PluginArray thật)
    const fakePlugin = {
      description: "Portable Document Format",
      filename: "internal-pdf-viewer",
      length: 1,
      name: "Chrome PDF Plugin",
      0: {
        type: "application/pdf",
        suffixes: "pdf",
        description: "Portable Document Format",
      },
      toString: () => "[object Plugin]",
    };

    const fakePlugins = {
      length: 1,
      0: fakePlugin,
      namedItem: () => fakePlugin,
      item: () => fakePlugin,
      toString: () => "[object PluginArray]",
    };

    Object.defineProperty(navigator, "plugins", {
      get: () => fakePlugins,
    });

    // 3. Patch navigator.languages
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    // 4. Patch canvas fingerprint
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (...args) {
      const context = this.getContext("2d");
      context.fillStyle = "rgb(100,100,100)";
      context.fillRect(0, 0, this.width, this.height);
      return toDataURL.apply(this, args);
    };

         // 5. Patch navigator.platform nếu đang chạy Linux
     Object.defineProperty(navigator, "platform", {
       get: () => "Linux x86_64",
     });
     
     // 6. Remove automation indicators
     Object.defineProperty(navigator, 'webdriver', {
       get: () => undefined,
     });
     
     // 7. Patch permissions
     const originalQuery = window.navigator.permissions.query;
     window.navigator.permissions.query = (parameters) => (
       parameters.name === 'notifications' ?
         Promise.resolve({ state: Notification.permission }) :
         originalQuery(parameters)
     );
     
     // 8. Patch chrome object
     Object.defineProperty(window, 'chrome', {
       writable: true,
       enumerable: true,
       configurable: true,
       value: {
         runtime: {},
         loadTimes: function() {},
         csi: function() {},
         app: {}
       }
     });
     
     // 9. Patch connection
     Object.defineProperty(navigator, 'connection', {
       get: () => ({
         effectiveType: '4g',
         rtt: 50,
         downlink: 10,
         saveData: false
       })
     });
   });
 
   // Add random delay before navigation to appear more human
   await waitFor(Math.random() * 2000 + 1000);
 
   await page.goto(url, { 
     waitUntil: 'domcontentloaded',
     timeout: 30000 
   });

  // Wait for the specific element to appear
  if (waitKey) {
    console.log("wait for", waitKey);
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
    console.log("wait for 60 seconds");
    await waitFor(60000);
    console.log("Network is idle");
  }

  const html = await page.content();
  await page.close(); // Close page instead of browser to reuse browser instance
  return html;
}

module.exports = {
  addUrlToQueue,
};
