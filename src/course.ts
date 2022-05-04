"use strict";

import { DateTime } from "luxon";
import { ElementHandle, Page } from "puppeteer";

export interface Course {
    readonly number: number;
    readonly detail: string;
    readonly day: string;
    readonly time: string;
    readonly location: string;
    readonly duration: string;
    readonly guidance: string;
    readonly bookable: boolean;
}

async function getContent(page: Page, element: ElementHandle<Element>): Promise<string> {
    return page.evaluate(el => el.textContent, element);
}

export async function courseExists(page: Page, id: number): Promise<boolean> {
    const matchingCourses = await page.$x(`//*[@class = 'bs_sknr' and text()=${id}]`);
    return matchingCourses.length > 0;
}

export async function getCourse(page: Page, id: number): Promise<Course> {
    const number_element = (await page.$x(`//*[@class = 'bs_sknr' and text()=${id}]`))[0];
    const siblings = await number_element.$x('following-sibling::*');
    const detail = await getContent(page, siblings[0]);
    const day = await getContent(page, siblings[1]);
    const time = await getContent(page, siblings[2]);
    const location = await getContent(page, siblings[3]);
    const duration = await getContent(page, siblings[4]);
    const guidance = await getContent(page, siblings[5]);
    const bookingContent = await getContent(page, siblings[6]);
    const bookable = bookingContent == "buchen";

    return {
        number: id,
        detail: detail,
        day: day,
        time: time,
        location: location,
        duration: duration,
        guidance: guidance,
        bookable: bookable
    };
}

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

export function nextCourseEnd(course: Course): DateTime {
    const [_, end] = course.time.split('-');
    return nextDayAtTime(course.day, end);
}

export function nextCourseStart(course: Course): DateTime {
    const [start, _] = course.time.split('-');
    return nextDayAtTime(course.day, start);
}

function nextDayAtTime(day: string, time: string): DateTime {
    // get time in Germany
    const now = DateTime.local().setZone("Europe/Berlin");
    // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    const today = longdayNumber[now.weekdayLong];
    const courseDay = dayNumber[day];
    // get day until it is the course day again. +7 is a buffer so the result is alway positive.
    const diff = (courseDay - today + 7) % 7;
    // split time
    const [hour, minute] = time.split(':').map(x => parseInt(x));
    // construct next course date
    let nextDay = now.plus({ days: diff });
    nextDay = nextDay.set({ hour: hour, minute: minute, second: 0, millisecond: 0 });
    if (now >= nextDay) {
        nextDay = nextDay.plus({ days: 7 });
    }
    return nextDay;
}