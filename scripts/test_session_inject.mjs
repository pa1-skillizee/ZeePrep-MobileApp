import puppeteer from 'puppeteer-core';

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

async function test() {
  console.log('Testing localStorage session injection...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to root...');
  await page.goto(`${BASE_URL}`, { waitUntil: 'domcontentloaded' });

  console.log('Injecting session into localStorage...');
  await page.evaluate((u) => {
    localStorage.setItem('zeeprep_mobile_user_session', JSON.stringify(u));
    localStorage.setItem('zeeprep_mobile_view_mode', 'student');
  }, studentUser);

  console.log('Navigating to /exams...');
  await page.goto(`${BASE_URL}/exams`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const pageTitle = await page.title();
  const textSnippet = await page.evaluate(() => document.body.innerText.slice(0, 400));
  console.log('Page Title:', pageTitle);
  console.log('Current URL:', page.url());
  console.log('Page Text:', textSnippet.replace(/\n+/g, ' '));

  await browser.close();
}

test().catch(console.error);
