import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'https://zeeprep-app.web.app';

async function clickByText(page, text, exact = false) {
  const handles = await page.$$('div, span, button, [role="button"], p');
  for (const handle of handles) {
    const content = await page.evaluate(el => el.textContent, handle);
    if (!content) continue;
    const match = exact ? content.trim() === text : content.includes(text);
    if (match) {
      const box = await handle.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        // Move mouse and click center
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        return true;
      }
    }
  }
  return false;
}

async function run() {
  console.log('Launching Chrome with real mouse pointer events...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));

  await page.setViewport({ width: 1920, height: 1080 });

  console.log('1. Loading Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking Student Login tab...');
  await clickByText(page, 'Student Login', true);
  await new Promise(r => setTimeout(r, 800));

  console.log('Clicking Class 11 - 1 demo button...');
  await clickByText(page, 'Class 11 - 1', false);
  await new Promise(r => setTimeout(r, 800));

  console.log('Clicking Log In as Student button...');
  await clickByText(page, 'Log In as Student', false);

  console.log('Monitoring navigation after click...');
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    console.log(`[${i}s] URL:`, page.url());
    const text = await page.evaluate(() => document.body.innerText.slice(0, 200));
    if (!page.url().includes('/login')) {
      console.log('SUCCESS! Navigated to:', page.url());
      console.log('Page Content Preview:', text.replace(/\n+/g, ' '));
      break;
    }
  }

  await browser.close();
}

run().catch(console.error);
