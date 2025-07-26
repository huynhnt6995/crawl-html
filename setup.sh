#!/bin/bash

# Setup script for Vultr Ubuntu server
echo "Setting up environment for web scraping..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install required dependencies
sudo apt install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libxshmfence1 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxss1 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libdrm2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libxshmfence1

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Install Chromium
echo "Installing Chromium..."
sudo apt install -y chromium-browser

# Create temp directory for Chromium
mkdir -p /tmp/chromium-user-data

# Set permissions
chmod 755 /tmp/chromium-user-data

echo "Setup completed!"
echo "To run the application: node index.js" 