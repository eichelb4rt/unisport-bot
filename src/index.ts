"use strict";

import fs from 'fs';
import schedule from 'node-schedule';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Config } from './config.js';
import { Bookings } from './bookings.js';
import { UnisportPage } from './unisport.js';
import { exit } from 'process';
import { DateTime } from 'luxon';
import { nextCourseEnd, nextCourseStart } from './course.js';

puppeteer.use(StealthPlugin());

(async () => {
    // read config
    const configPath = 'config.json';
    if (!fs.existsSync(configPath)) {
        console.log(`You need a '${configPath}' file!`);
        return;
    }
    const config = new Config(configPath);

    // if the last booking is on a future day, we don't even have to start the browser.
    const bookings = new Bookings();
    const lastBooked = bookings.lastBooked(config.course_number);
    if (DateTime.now().startOf("day") < lastBooked.startOf("day")) {
        console.log(`You already booked the next course: ${lastBooked.toFormat("yyyy-MM-dd")}, exiting.`);
        exit(0);
    }

    // navigate to course url
    console.log("launching...");
    const browser = await puppeteer.launch({ headless: true });
    const page = new UnisportPage(browser);
    await page.launch(config.course_url);

    // get course if existing
    console.log("getting course...")
    if (!await page.courseExists(config.course_number)) {
        console.log(`course number ${config.course_number} not found, exiting.`);
        await browser.close();
        return;
    }
    const course = await page.getCourse(config.course_number);
    console.log(course);

    // if we can't book anything, we might as well just stop
    if (course.bookable) {
        console.log("Course not bookable, exiting.");
        await browser.close();
        exit(0);
    }

    // if we don't want to book now, we're done here
    if (!config.enable_booking) {
        console.log("Booking disabled, exiting.");
        await browser.close();
        exit(0);
    }

    // function for booking
    async function book() {
        // here we check if we know that we already booked something
        console.log("getting bookable dates...");
        await page.goToBooking(course);
        const dateStrings = await page.getAllBookableDates();
        console.log(`bookable dates: ${dateStrings.length > 0 ? dateStrings : 'none'}`);

        const toBook = dateStrings.filter(d => !bookings.isBooked(course.number, d));
        console.log(`not booked yet: ${toBook.length > 0 ? toBook : 'none'}`);

        // if we can't book anything, we might as well just stop
        if (toBook.length == 0) {
            console.log("Nothing to book, exiting.");
            await browser.close();
            exit(0);
        }

        // we'll just book the next available course
        const bookNext = toBook[0];
        // now finally book a course
        console.log(`booking: ${bookNext}`);
        await page.book(bookNext, config.mail, config.password);
        // also locally register that we booked it, no matter if we did it just now or earlier
        bookings.register(course.number, bookNext);
        if (await page.bookedSuccessfully()) {
            console.log("Booked successfully!");
        } else {
            console.log("You already booked this course!");
        }

        // get proof
        console.log("taking a screenshot...");
        await page.wait(2000);
        await page.screenshot("result.png");

        // we're done with everything now. it's ok.
        await browser.close();
        exit(0);
    }

    // gather dates
    const nextStart = nextCourseStart(course);
    const nextEnd = nextCourseEnd(course);
    // what we know: we haven't booked anything on a future day -> our last booking was either on a past day or today.
    // if our last booking was on a past day, book today.
    if (DateTime.now().startOf("day") > lastBooked.startOf("day")) await book();
    // now we know that today is already booked. wait until the end of the course today and book the next course.
    const bookingTime = nextStart.plus({ minutes: 5 });
    console.log(`Waiting until ${bookingTime} (That is ${bookingTime.toJSDate().toLocaleString()} here.).`);
    // if the end of the course is already over, just book the next course now. otherwise book as planned (by schedule)
    if (bookingTime <= DateTime.now()) await book();
    else schedule.scheduleJob(bookingTime.toJSDate(), book);
})();