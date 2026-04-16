import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_PAGEERROR:', error.message));

  await page.goto('https://buscatumaestro-ai-studio-git-main-franco-s-projects-b4b16360.vercel.app/', { waitUntil: 'networkidle0' });
  
  await browser.close();
})();
