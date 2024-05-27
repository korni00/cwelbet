import puppeteer, { Page } from 'puppeteer';
import { resolveEndedMatches } from '../commands/bet/resolveBet';
import { client } from '../utils/client';
import { scrapePage } from '../utils/scraper';
import * as variables from '../utils/config';

export const useScraper = async () => {
  console.log('Starting scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page: Page = await browser.newPage();
  await page.goto(variables.LINK_FOR_SCRAPING, {
    waitUntil: 'networkidle2',
  });

  const refreshAndScrape = async () => {
    try {
      await page.reload({ waitUntil: 'networkidle2' });
      await scrapePage(page);
      await resolveEndedMatches(client);
    } catch (error) {
      console.error('Error during scraping:', error);
    }
  };

  setInterval(refreshAndScrape, 15000);
};
