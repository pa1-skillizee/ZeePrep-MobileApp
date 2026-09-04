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

const studentUser = {
  uid: 'stu11a_uid_test',
  name: 'Rohan Sharma',
  email: 'student11a@zeeprep.com',
  loginId: 'ZP-STU-1101',
  role: 'student',
  grade: '11',
  section: 'A',
  board: 'CBSE',
  stream: 'Science',
  status: 'active',
  approvalStatus: 'approved',
};

const superAdminUser = {
  uid: 'pa1_superadmin_uid',
  name: 'PA1 SuperAdmin',
  email: 'pa1@skillizee.io',
  role: 'superadmin',
  status: 'active',
  approvalStatus: 'approved',
};

async function setupSession(page, user, viewMode = 'student') {
  await page.evaluate((u, vm) => {
    localStorage.setItem('zeeprep_mobile_user_session', JSON.stringify(u));
    localStorage.setItem('zeeprep_mobile_view_mode', vm);
  }, user, viewMode);
}

async function capture() {
  console.log('=== Starting Real Play Store Asset Capture (Laptop 1080p + Phone 1080x2400 + Feature Graphic) ===\n');

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

  // ==========================================
  // PART 1: 1080p LAPTOP / DESKTOP / 10-INCH TABLET SCREENSHOTS (1920 x 1080)
  // ==========================================
  console.log('--- 1. Capturing 1080p Laptop / Desktop Screenshots (1920 x 1080) ---');
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  // 1. Laptop Login
  console.log('1.1 Capturing Laptop Login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const laptopLoginPath = path.join(outputDir, 'playstore-laptop-1-login.png');
  await page.screenshot({ path: laptopLoginPath });
  console.log(`✓ Saved: ${laptopLoginPath}`);

  // Set Student Session
  await setupSession(page, studentUser, 'student');

  // 1.2 Laptop Exams Dashboard
  console.log('1.2 Capturing Laptop Student Dashboard / Exams...');
  await page.goto(`${BASE_URL}/exams`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const laptopExamsPath = path.join(outputDir, 'playstore-laptop-2-exams.png');
  await page.screenshot({ path: laptopExamsPath });
  console.log(`✓ Saved: ${laptopExamsPath}`);

  // 1.3 Laptop Live CBT Exam Screen
  console.log('1.3 Capturing Laptop Live CBT Exam...');
  await page.goto(`${BASE_URL}/exam/exam_cbse11_math_lvl1`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500));
  const laptopExamLivePath = path.join(outputDir, 'playstore-laptop-3-cbt-exam.png');
  await page.screenshot({ path: laptopExamLivePath });
  console.log(`✓ Saved: ${laptopExamLivePath}`);

  // 1.4 Laptop Diagnostic Report
  console.log('1.4 Capturing Laptop Diagnostic Performance Report...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const laptopReportPath = path.join(outputDir, 'playstore-laptop-4-report.png');
  await page.screenshot({ path: laptopReportPath });
  console.log(`✓ Saved: ${laptopReportPath}`);

  // 1.5 Laptop Study Resources
  console.log('1.5 Capturing Laptop Study Library & Resources...');
  await page.goto(`${BASE_URL}/resources`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const laptopResPath = path.join(outputDir, 'playstore-laptop-5-resources.png');
  await page.screenshot({ path: laptopResPath });
  console.log(`✓ Saved: ${laptopResPath}`);

  // 1.6 Laptop SuperAdmin / Faculty Dashboard
  console.log('1.6 Capturing Laptop SuperAdmin Management Console...');
  await setupSession(page, superAdminUser, 'superadmin');
  await page.goto(`${BASE_URL}/(superadmin)`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const laptopAdminPath = path.join(outputDir, 'playstore-laptop-6-admin-console.png');
  await page.screenshot({ path: laptopAdminPath });
  console.log(`✓ Saved: ${laptopAdminPath}`);

  // ==========================================
  // PART 2: REAL PHONE SCREENSHOTS (1080 x 2400)
  // ==========================================
  console.log('\n--- 2. Capturing Real Phone Screenshots (1080 x 2400) ---');
  await page.setViewport({
    width: 360,
    height: 800,
    deviceScaleFactor: 3, // Exact 1080 x 2400 px
    isMobile: true,
    hasTouch: true,
  });

  // 2.1 Phone Login
  console.log('2.1 Capturing Phone Login...');
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  const phoneLoginPath = path.join(outputDir, 'playstore-screenshot-1-login.png');
  await page.screenshot({ path: phoneLoginPath });
  console.log(`✓ Saved: ${phoneLoginPath}`);

  // Restore Student Session
  await setupSession(page, studentUser, 'student');

  // 2.2 Phone Exams Dashboard
  console.log('2.2 Capturing Phone Student Dashboard / Exams...');
  await page.goto(`${BASE_URL}/exams`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const phoneExamsPath = path.join(outputDir, 'playstore-screenshot-2-exams.png');
  await page.screenshot({ path: phoneExamsPath });
  console.log(`✓ Saved: ${phoneExamsPath}`);

  // 2.3 Phone Live CBT Exam
  console.log('2.3 Capturing Phone Live CBT Exam...');
  await page.goto(`${BASE_URL}/exam/exam_cbse11_math_lvl1`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3500));
  const phoneExamLivePath = path.join(outputDir, 'playstore-screenshot-3-cbt-exam.png');
  await page.screenshot({ path: phoneExamLivePath });
  console.log(`✓ Saved: ${phoneExamLivePath}`);

  // 2.4 Phone Reports
  console.log('2.4 Capturing Phone Diagnostic Report...');
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const phoneReportPath = path.join(outputDir, 'playstore-screenshot-4-report.png');
  await page.screenshot({ path: phoneReportPath });
  console.log(`✓ Saved: ${phoneReportPath}`);

  // 2.5 Phone Resources
  console.log('2.5 Capturing Phone Study Resources...');
  await page.goto(`${BASE_URL}/resources`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  const phoneResPath = path.join(outputDir, 'playstore-screenshot-5-resources.png');
  await page.screenshot({ path: phoneResPath });
  console.log(`✓ Saved: ${phoneResPath}`);

  // ==========================================
  // PART 3: FEATURE GRAPHIC (1024 x 500)
  // ==========================================
  console.log('\n--- 3. Generating 1024x500 Feature Graphic with authentic UI ---');
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
            width: 450px;
            height: 450px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, rgba(0,0,0,0) 70%);
            top: -60px;
            right: 220px;
          }
          .left {
            max-width: 520px;
            z-index: 2;
          }
          .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.12);
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
            font-size: 42px;
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
            background: rgba(30, 41, 59, 0.85);
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
          <p class="sub">Official NTA CBT Test Series, AI Weak-Topic Discovery, and Curated Study Library for Class 11 & Competitive Exams.</p>
          <div class="tags">
            <div class="tag">NTA CBT Interface</div>
            <div class="tag">Diagnostic AI</div>
            <div class="tag">Topic Library</div>
          </div>
        </div>
        <div class="right">
          <div class="phone-mock">
            <img src="file://${phoneExamLivePath.replace(/\\/g, '/')}" />
          </div>
          <div class="phone-mock" style="transform: translateY(20px);">
            <img src="file://${phoneExamsPath.replace(/\\/g, '/')}" />
          </div>
        </div>
      </body>
    </html>
  `;

  await featurePage.setContent(featureHtml, { waitUntil: 'load' });
  const featureGraphicPath = path.join(outputDir, 'playstore-feature-graphic-1024x500.png');
  await featurePage.screenshot({ path: featureGraphicPath });
  console.log(`✓ Saved: ${featureGraphicPath}`);

  await browser.close();
  console.log('\n=== ALL REAL ASSETS CAPTURED & SAVED SUCCESSFULLY! ===');
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
