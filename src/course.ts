import { ElementHandle, Page } from "puppeteer";

export class Course {
    readonly number: number;
    readonly detail: string;
    readonly day: string;
    readonly time: string;
    readonly duration: string;
    readonly guidance: string;
    readonly cost: string | number;
    readonly bookable: boolean;

    constructor(number: number, detail: string, day: string, time: string, duration: string, guidance: string, cost: string | number, bookable: boolean) {
        this.number = number;
        this.detail = detail;
        this.day = day;
        this.time = time;
        this.duration = duration;
        this.guidance = guidance;
        this.cost = cost;
        this.bookable = bookable;
    }

    public toString = (): string => {
        return `Kurs (id: ${this.number}, detail: ${this.detail}, day: ${this.day}, time: ${this.time}, duration: ${this.duration}, guidance: ${this.guidance}, cost: ${this.cost}, bookable: ${this.bookable})`;
    }

    static async fromElement(page: Page, id: number): Promise<Course> {
        const number_element = (await page.$x(`//*[@class = 'bs_sknr' and text()=${id}]`))[0];
        const siblings = await number_element.$x('following-sibling::*');
        const detail = await this.getContent(page, siblings[0]);
        const day = await this.getContent(page, siblings[1]);
        const time = await this.getContent(page, siblings[2]);
        const duration = await this.getContent(page, siblings[3]);
        const guidance = await this.getContent(page, siblings[4]);
        const cost = await this.getContent(page, siblings[5]);
        const bookingContent = await this.getContent(page, siblings[6]);
        const bookable = bookingContent == "buchen";
        return new Course(id, detail, day, time, duration, guidance, cost, bookable);
    }

    static async getContent(page: Page, element: ElementHandle<Element>): Promise<string> {
        return page.evaluate(el => el.textContent, element);
    }
}