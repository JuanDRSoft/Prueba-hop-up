const dotenv = require("dotenv").config();

module.exports = {
  DISPLAY: process.env.DISPLAY || ":0",
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || true,
};
