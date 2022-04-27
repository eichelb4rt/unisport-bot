"use strict";

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import 'dotenv/config'
import { UnisportPage } from './unisport.js';

puppeteer.use(StealthPlugin());

(async () => {
    const enbale_booking = true;
    const email = process.env.MAIL;
    const password = process.env.PW;

    const browser = await puppeteer.launch({ headless: true });
    const page = new UnisportPage(browser);

    console.log("launching...");
    await page.launch();

    console.log("getting course...")
    const course = await page.get_course(10016);
    console.log(course);
    
    if (course.bookable) {
        console.log("course not bookable!");
        return;
    }
    console.log("course bookable!");

    if (enbale_booking) {
        console.log("booking...");
        await page.book(email, password);
        console.log("taking a screenshot...");
        await page.wait(2000);
        await page.screenshot("result.png");
    }

    await browser.close();
})();