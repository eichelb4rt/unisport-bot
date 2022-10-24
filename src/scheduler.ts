import puppeteer from 'puppeteer-extra';
import { DateTime } from "luxon";
import { Bookings } from "./bookings.js";
import { Course, CourseInfo } from "./course.js";
import { UnisportPage } from './unisport.js';
import schedule from 'node-schedule';

// 2 hour check interval
const CHECK_INTERVAL = 2 * 60 * 60 * 1000;
// check 5 minutes after course has started
const CHECK_DELAY_MINUTES = 5;

const dayNumber: { [day: string]: number } = {
    "Mo": 0,
    "Di": 1,
    "Mi": 2,
    "Do": 3,
    "Fr": 4,
    "Sa": 5,
    "So": 6
};

const longdayNumber: { [day: string]: number } = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6
};

export class Scheduler {
    #courses: CourseInfo[];
    #scheduledChecks: Set<string>;
    #removedCourses: Set<CourseInfo>;

    constructor() {
        this.#courses = [];
        this.#scheduledChecks = new Set<string>();
        this.#removedCourses = new Set<CourseInfo>();
    }

    add(course: CourseInfo) {
        this.#courses.push(course);
        console.log(`added ${course.name}`);
    }

    startLoop() {
        this.#checkSchedule();
        // because the waiting time is so long, we don't really have to wait for it
        setInterval(() => this.#checkSchedule(), CHECK_INTERVAL);
    }

    async #checkSchedule() {
        // TODO: check if courses need to be booked and book them if necessary
        for (const courseInfo of this.#courses) {
            await this.#checkCourse(courseInfo);
        }
        this.#removeCourses();
    }

    #removeCourses() {
        this.#courses = this.#courses.filter(c => !this.#removedCourses.has(c));
    }

    async #checkCourse(courseInfo: CourseInfo) {
        // check if the course can be book and book it if necessary
        const lastBooked = Bookings.lastBooked(courseInfo.number);

        // if the last booking is on a future day, we don't even have to start the browser.
        // (if there even is a last booking)
        if (lastBooked !== undefined && DateTime.now().startOf("day") < lastBooked.startOf("day")) {
            return;
        }

        // create browser and find the course
        const browser = await puppeteer.launch({ headless: true });
        const page = new UnisportPage(browser);
        await page.launch(courseInfo.url);
        // if the course does not exist, remove it from our list
        if (!await page.courseExists(courseInfo.number)) {
            console.log(`course ${courseInfo.name} not found, removing it from the list.`);
            this.#removedCourses.add(courseInfo);
            await browser.close();
            return;
        }
        const course = await page.getCourse(courseInfo.number);
        await browser.close();

        // book everything we can
        await Bookings.book(courseInfo);

        // schedule next check 5 minutes after the next course start
        this.#scheduleNextCheck(course, courseInfo);
    }

    #scheduleNextCheck(course: Course, courseInfo: CourseInfo) {
        // schedule next check 5 minutes after the next course start
        const nextCheck = Scheduler.#nextBookingTime(course);
        // if we already scheduled this check, stop
        const hash = nextCheck.toString();
        if (this.#scheduledChecks.has(hash)) {
            return;
        }
        schedule.scheduleJob(nextCheck.toJSDate(), () => this.#checkCourse(courseInfo));
        // remember that we scheduled this check
        this.#scheduledChecks.add(hash);
    }

    static #nextBookingTime(course: Course): DateTime {
        const [start, _] = course.time.split('-');
        // get time in Germany
        const now = DateTime.local().setZone("Europe/Berlin");
        // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
        const today = longdayNumber[now.weekdayLong];
        const courseDay = dayNumber[course.day];
        // get day until it is the course day again. +7 is a buffer so the result is always non-negative.
        const diff = (courseDay - today + 7) % 7;
        // split time
        const [hour, minute] = start.split(':').map(x => parseInt(x));
        // construct next course date
        let nextDay = now.plus({ days: diff });
        nextDay = nextDay.set({ hour: hour, minute: minute, second: 0, millisecond: 0 });
        // add delay to check again
        nextDay.plus({ minutes: CHECK_DELAY_MINUTES });
        // if we're already past that time, take next week
        if (now >= nextDay) {
            nextDay = nextDay.plus({ days: 7 });
        }
        return nextDay;
    }
}