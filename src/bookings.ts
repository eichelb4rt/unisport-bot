import fs from 'fs';
import { DateTime } from 'luxon';
import puppeteer from 'puppeteer-extra';
import { Config } from './config.js';
import { CourseInfo } from './course.js';
import { UnisportPage } from './unisport.js';

export namespace Bookings {
    const JSON_PATH = 'bookings.json';

    // map from course names to all booked dates in this course
    let bookings: { [course: number]: string[] } = {};
    if (!fs.existsSync(JSON_PATH)) {
        console.log(`'${JSON_PATH}' created.`);
        fs.writeFileSync(JSON_PATH, toJSON());
    }

    const bookingsJSON = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
    for (const course of bookingsJSON) {
        bookings[course.course_number] = course.booked_dates;
    }

    export function isBooked(course: number, date: string): boolean {
        const bookedDates = bookings[course];
        if (!bookedDates) return false;
        return bookedDates.includes(date);
    }

    export function register(course: number, date: string) {
        // don't do anything if it's already booked
        if (isBooked(course, date)) return;
        // create an array if nothing is booked yet
        if (!bookings[course]) bookings[course] = [];
        // push the booked date
        bookings[course].push(date);
        // and save it
        fs.writeFileSync(JSON_PATH, toJSON());
    }

    function toJSON() {
        const bookingsJSON = [];
        for (const course in bookings) {
            bookingsJSON.push({
                "course_number": course,
                "booked_dates": bookings[course]
            });
        }
        return JSON.stringify(bookingsJSON, null, 2);
    }

    export function lastBooked(course: number): DateTime | undefined {
        if (bookings[course] === undefined) return undefined;
        const dates = bookings[course].map(s => toDate(s).toMillis());
        const maxDate = Math.max(...dates);
        return DateTime.fromMillis(maxDate);
    }

    function toDate(dateString: string): DateTime {
        // remove "BS_Termin_" at the start of the date string
        dateString = dateString.slice("BS_Termin_".length);
        return DateTime.fromFormat(dateString, "yyyy-MM-dd", { zone: "Europe/Berlin" });
    }

    export async function book(courseInfo: CourseInfo) {
        // create browser and find the course
        const browser = await puppeteer.launch({ headless: true });
        const page = new UnisportPage(browser);
        await page.launch(courseInfo.url);
        // if the course does not exist, remove it from our list
        if (!await page.courseExists(courseInfo.number)) {
            console.log(`course ${courseInfo.name} not found, cannot book it.`);
            await browser.close();
            return;
        }
        const course = await page.getCourse(courseInfo.number);

        // if we can't book anything, stop
        if (course.bookable) {
            console.log("Course not bookable, exiting.");
            await browser.close();
            return;
        }

        // if we don't want to book now, we're done here
        if (!Config.enable_booking) {
            console.log("Booking disabled, exiting.");
            await browser.close();
            return;
        }

        // here we check if we know that we already booked something
        console.log("getting bookable dates...");
        await page.goToBooking(course);
        const dateStrings = await page.getAllBookableDates();
        console.log(`bookable dates: ${dateStrings.length > 0 ? dateStrings : 'none'}`);

        const toBook = dateStrings.filter(d => !isBooked(course.number, d));
        console.log(`not booked yet: ${toBook.length > 0 ? toBook : 'none'}`);

        // if we can't book anything, we might as well just stop
        if (toBook.length == 0) {
            console.log("Nothing to book.");
            await browser.close();
            return;
        }

        for (const booking of toBook) {
            // now finally book a course
            console.log(`booking: ${booking}`);
            await page.book(booking, Config.mail, Config.password);
            // also locally register that we booked it, no matter if we did it just now or earlier
            register(course.number, booking);
            if (await page.bookedSuccessfully()) {
                console.log("Booked successfully!");
            } else {
                console.log("You already booked this course!");
            }
        }
        // we're done with everything now. it's ok.
        await browser.close();
    }
}