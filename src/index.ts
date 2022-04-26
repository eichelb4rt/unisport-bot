"use strict";

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'puppeteer'
import 'dotenv/config'

puppeteer.use(StealthPlugin());

async function instant_click(page: Page, selector: string) {
    return page.evaluate((_selector) => {
        (document.querySelector(_selector) as HTMLElement).click();
    }, selector);
}

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto("https://www.hochschulsportbuchung.uni-jena.de/angebote/aktueller_zeitraum/index.html");
    console.log("went to site.");

    await instant_click(page, "[name=BS_Kursid_101861]");
    console.log("clicked button.");

    await page.screenshot({
        fullPage: true,
        path: "example.png"
    });

    await browser.close();
})();