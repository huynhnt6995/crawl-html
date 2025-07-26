# Web Scraping Service

A Node.js service for web scraping with Cloudflare bypass capabilities using Puppeteer.

## Features

- Cloudflare CAPTCHA bypass
- Element-based waiting (wait for specific CSS selectors)
- Network idle detection
- Anti-detection measures
- Queue-based processing

## Server Setup (Vultr Ubuntu)

### 1. Initial Setup

```bash
# Clone the repository
git clone <your-repo>
cd crawl-html

# Run setup script
chmod +x setup.sh
./setup.sh
```

### 2. Manual Setup (if needed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Chrome dependencies
sudo apt install -y \
    wget gnupg ca-certificates procps libxss1 \
    libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libasound2 libxshmfence1 libgtk-3-0 libgdk-pixbuf2.0-0 \
    libx11-xcb1 libxcb-dri3-0

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install
```

### 3. Production Deployment

```bash
# Install PM2 globally
sudo npm install -g pm2

# Create logs directory
mkdir -p logs

# Start with PM2
npm run pm2:start

# Check status
pm2 status

# View logs
npm run pm2:logs
```

## Usage

### API Endpoint

```
POST http://your-server:8888
```

### Request Body

```json
{
  "url": "https://example.com",
  "callbackUrl": "https://your-callback-url.com",
  "waitKey": "#h1"
}
```

### Parameters

- `url` (required): The website URL to scrape
- `callbackUrl` (optional): URL to send the HTML response to
- `waitKey` (optional): CSS selector to wait for (e.g., "#h1", ".content")

### Example

```bash
curl -X POST http://localhost:8888 \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "callbackUrl": "https://webhook.site/your-url",
    "waitKey": "#main-content"
  }'
```

## PM2 Commands

```bash
# Start application
npm run pm2:start

# Stop application
npm run pm2:stop

# Restart application
npm run pm2:restart

# View logs
npm run pm2:logs

# Monitor
pm2 monit
```

## Troubleshooting

### Chromium Issues
- Ensure all dependencies are installed: `./setup.sh`
- Check Chromium binary path: `which chromium-browser`
- Set custom Chromium path: `export CHROMIUM_BIN=/usr/bin/chromium-browser`

### Memory Issues
- Monitor memory usage: `pm2 monit`
- Restart if needed: `pm2 restart crawl-html`

### Permission Issues
- Ensure temp directory exists: `mkdir -p /tmp/chromium-user-data`
- Set permissions: `chmod 755 /tmp/chromium-user-data`

## Security Notes

- The service runs with `--no-sandbox` for root compatibility
- Consider using a reverse proxy (nginx) for production
- Implement rate limiting for production use
- Use HTTPS in production environment 