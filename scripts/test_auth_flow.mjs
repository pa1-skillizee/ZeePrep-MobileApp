import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.join(__dirname, '..', 'playstore_assets');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://zeeprep-app.web.app';

async function run() {
  console.log('Launching Chrome to test login and navigation...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1920,1080',
    ],
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Loading Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking Student Login...');
  // Find all elements with text "Student Login" or click the demo button
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, span, button, [role="button"]'));
    for (const d of divs) {
      if (d.textContent && d.textContent.trim() === 'Student Login') {
        d.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('Clicking Demo Button (Class 11 - 1)...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, span, button, [role="button"]'));
    for (const d of divs) {
      if (d.textContent && d.textContent.includes('Class 11 - 1')) {
        d.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 800));

  console.log('Clicking Log In button...');
  await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div, span, button, [role="button"]'));
    for (const d of divs) {
      if (d.textContent && (d.textContent.trim() === 'Log In as Student' || d.textContent.trim() === 'Log In')) {
        d.click();
        break;
      }
    }
  });

  console.log('Waiting for login redirect...');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const currentUrl = page.url();
    console.log(`Current URL [${i}s]:`, currentUrl);
    if (!currentUrl.includes('/login') && (currentUrl.includes('/(tabs)') || currentUrl.endsWith('/') || currentUrl.includes('/exams') || currentUrl.includes('web.app'))) {
      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 150));
      console.log('Page body snippet:', bodyText);
      if (!bodyText.includes('Sign in with your email')) {
        console.log('Successfully logged in and on authenticated page!');
        break;
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
