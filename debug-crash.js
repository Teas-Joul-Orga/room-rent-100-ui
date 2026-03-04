import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const page = await browser.newPage();

page.on('console', msg => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

console.log('Logging in...');
await page.goto('http://localhost:5173');
await page.type('input[type="email"]', 'admin@example.com');
await page.type('input[type="password"]', 'password');
await page.click('button[type="submit"]');
await page.waitForNavigation({ waitUntil: 'networkidle0' });

console.log('Navigating to rooms...');
await page.goto('http://localhost:5173/dashboard/rooms', { waitUntil: 'networkidle0' });

await new Promise(r => setTimeout(r, 2000));
await browser.close();
