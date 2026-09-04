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

async function capture() {
  console.log('Launching Headless Chrome for Real In-App Screenshots...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--window-size=1080,2400',
    ],
  });

  const page = await browser.newPage();

  // Configure high-DPI modern Android device viewport (Exact 1080 x 2400)
  await page.setViewport({
    width: 360,
    height: 800,
    deviceScaleFactor: 3, // Produces exact 1080 x 2400 px
    isMobile: true,
    hasTouch: true,
  });

  // 1. Capture Real Login Screen
  console.log('1. Navigating to Login Screen...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const loginPath = path.join(outputDir, 'playstore-screenshot-1-login.png');
  await page.screenshot({ path: loginPath });
  console.log(`Saved: ${loginPath}`);

  // 2. Perform Login as Demo Student (student11a@zeeprep.com / Password@123)
  console.log('Logging in as student...');
  try {
    const textInputs = await page.$$('input');
    if (textInputs.length >= 2) {
      await textInputs[0].click({ clickCount: 3 });
      await textInputs[0].type('student11a@zeeprep.com', { delay: 20 });
      await textInputs[1].click({ clickCount: 3 });
      await textInputs[1].type('Password@123', { delay: 20 });

      const buttons = await page.$$('button, [role="button"]');
      for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Log In') || text.includes('Student'))) {
          await btn.click();
          break;
        }
      }
    }
  } catch (e) {
    console.log('Login automation fallback:', e.message);
  }

  await new Promise(r => setTimeout(r, 3500));

  // 2. Capture Real Exams Dashboard
  console.log('2. Navigating to Exams Dashboard...');
  await page.goto(`${BASE_URL}/exams`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const examsPath = path.join(outputDir, 'playstore-screenshot-2-exams.png');
  await page.screenshot({ path: examsPath });
  console.log(`Saved: ${examsPath}`);

  // 3. Capture Real CBT Exam Screen
  console.log('3. Navigating to Live CBT Exam...');
  await page.goto(`${BASE_URL}/exam/exam_cbse11_math_lvl1`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const examLivePath = path.join(outputDir, 'playstore-screenshot-3-cbt-exam.png');
  await page.screenshot({ path: examLivePath });
  console.log(`Saved: ${examLivePath}`);

  // 4. Capture Real Performance Diagnostic Report
  console.log('4. Navigating to Diagnostic Report...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const reportPath = path.join(outputDir, 'playstore-screenshot-4-report.png');
  await page.screenshot({ path: reportPath });
  console.log(`Saved: ${reportPath}`);

  // 5. Capture Real Topic Resources Screen
  console.log('5. Navigating to Study Resources...');
  await page.goto(`${BASE_URL}/resources`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  const resPath = path.join(outputDir, 'playstore-screenshot-5-resources.png');
  await page.screenshot({ path: resPath });
  console.log(`Saved: ${resPath}`);

  // 6. Generate 1024x500 Feature Graphic with real UI
  console.log('6. Generating 1024x500 Feature Graphic with real UI...');
  const featurePage = await browser.newPage();
  await featurePage.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  
  const featureHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          body {
            width: 1024px;
            height: 500px;
            background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px 60px;
            color: #FFFFFF;
            position: relative;
            overflow: hidden;
          }
          .glow {
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0,0,0,0) 70%);
            top: -50px;
            right: 200px;
          }
          .left {
            max-width: 520px;
            z-index: 2;
          }
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #818CF8;
            color: #FBBF24;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.5px;
            margin-bottom: 16px;
          }
          .title {
            font-size: 44px;
            font-weight: 900;
            line-height: 1.15;
            margin-bottom: 14px;
            letter-spacing: -1px;
          }
          .title span {
            color: #818CF8;
          }
          .sub {
            font-size: 16px;
            color: #CBD5E1;
            line-height: 1.5;
            margin-bottom: 24px;
          }
          .tags {
            display: flex;
            gap: 10px;
          }
          .tag {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid #334155;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #94A3B8;
            font-weight: 600;
          }
          .right {
            display: flex;
            gap: 16px;
            z-index: 2;
          }
          .phone-mock {
            width: 175px;
            height: 370px;
            border-radius: 20px;
            border: 4px solid #475569;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
            overflow: hidden;
            background: #000;
          }
          .phone-mock img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        </style>
      </head>
      <body>
        <div class="glow"></div>
        <div class="left">
          <div class="badge">SMART LMS & CBT EXAMS</div>
          <h1 class="title">ZeePrep <span>Smart Prep</span></h1>
          <p class="sub">Official NTA CBT Test Series, AI Score Predictions, and Curated Topic-Wise Study Library for Class 11 & Competitive Exams.</p>
          <div class="tags">
            <div class="tag">NTA JEE Interface</div>
            <div class="tag">Weak-Topic AI</div>
            <div class="tag">Multi-Level Tests</div>
          </div>
        </div>
        <div class="right">
          <div class="phone-mock">
            <img src="file://${examLivePath.replace(/\\/g, '/')}" />
          </div>
          <div class="phone-mock" style="transform: translateY(20px);">
            <img src="file://${reportPath.replace(/\\/g, '/')}" />
          </div>
        </div>
      </body>
    </html>
  `;

  await featurePage.setContent(featureHtml, { waitUntil: 'load' });
  const featureGraphicPath = path.join(outputDir, 'playstore-feature-graphic-1024x500.png');
  await featurePage.screenshot({ path: featureGraphicPath });
  console.log(`Saved: ${featureGraphicPath}`);

  await browser.close();
  console.log('All authentic in-app screenshots and feature graphic captured successfully!');
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
