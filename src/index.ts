"use strict";

import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { UnisportPage } from './unisport.js';
import { Bookings } from './bookings.js';
import { Config } from './config.js';

puppeteer.use(StealthPlugin());

(async () => {
    // read config
    const configPath = 'config.json';
    if (!fs.existsSync(configPath)) {
        console.log(`You need a '${configPath}' file!`);
        return;
    }
    const config = new Config(configPath);

    // navigate to course url
    console.log("launching...");
    const browser = await puppeteer.launch({ headless: true });
    const page = new UnisportPage(browser);
    await page.launch(config.course_url);

    console.log("getting course...")
    const course = await page.getCourse(config.course_number);
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

    if (config.enable_booking) {
        const bookNext = toBook[0];
        console.log(`booking: ${bookNext}`);
        await page.book(bookNext, config.mail, config.password);
        bookings.register(course.number, bookNext);
        if (await page.bookedSuccessfully()) {
            console.log("booked successfully!");
        } else {
            console.log("you already booked this course!");
        }

        console.log("taking a screenshot...");
        await page.wait(2000);
        await page.screenshot("result.png");
    }

    await browser.close();
})();