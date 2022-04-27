"use strict";

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import 'dotenv/config'
import { UnisportPage } from './unisport.js';
import { Bookings } from './bookings.js';

puppeteer.use(StealthPlugin());

(async () => {
    const enbale_booking = true;

    const browser = await puppeteer.launch({ headless: true });
    const page = new UnisportPage(browser);

    console.log("launching...");
    await page.launch();

    console.log("getting course...")
    const course = await page.getCourse(10016);
    console.log(course);

    // if we can't book anything, we might as well just stop
    if (course.bookable) {
        console.log("course not bookable!");
        await browser.close();
        return;
    }

    console.log("getting bookable dates...");
    await page.goToBooking(course);
    const dates = await page.getAllBookableDates();
    console.log(`bookable dates: ${dates.length > 0 ? dates : 'none'}`);

    const bookings = new Bookings();
    const toBook = dates.filter(date => !bookings.isBooked(course.number, date));
    console.log(`not booked yet: ${toBook.length > 0 ? toBook : 'none'}`);

    // if we can't book anything, we might as well just stop
    if (toBook.length == 0) {
        await browser.close();
        return;
    }

    if (enbale_booking) {
        const bookNext = toBook[0];
        console.log(`booking: ${bookNext}`);
        const email = process.env.MAIL;
        const password = process.env.PW;
        await page.book(bookNext, email, password);
        bookings.book(course.number, bookNext);
        console.log("taking a screenshot...");
        await page.wait(2000);
        await page.screenshot("result.png");
    }

    await browser.close();
})();