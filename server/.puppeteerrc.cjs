const { join } = require('path');

/**
 * Puppeteer configuration for Vercel deployment.
 *
 * By default, Puppeteer stores the Chromium binary in $HOME/.cache/puppeteer/
 * which is OUTSIDE the project directory. Vercel's function bundler only
 * includes files from within the project, so the binary gets silently excluded.
 *
 * This config forces Puppeteer to download and store the Chromium binary
 * inside the project directory (.cache/puppeteer/), ensuring Vercel
 * bundles it into the serverless function.
 *
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
