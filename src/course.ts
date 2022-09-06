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

export interface CourseInfo {
    readonly name: string;
    readonly url: string;
    readonly number: number;
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