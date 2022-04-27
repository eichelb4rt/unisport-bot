import { Browser, Page } from "puppeteer";
import { Course } from "./course.js";

export class UnisportPage {
    readonly #browser: Browser;
    #page: Page;

    constructor(browser: Browser) {
        this.#browser = browser;
    }

    async #click(selector: string, wait = false) {
        const evalPromise = this.#page.evaluate((_selector) => {
            (document.querySelector(_selector) as HTMLElement).click();
        }, selector);
        if (wait) return Promise.all([evalPromise, this.#page.waitForNavigation({ waitUntil: 'networkidle2' })]);
        return evalPromise;
    }

    async launch() {
        // go to course and click on book
        this.#page = await this.#browser.newPage();
        await this.#page.goto("https://www.hochschulsportbuchung.uni-jena.de/angebote/aktueller_zeitraum/_UNISPORT_Card_-_Zweifelder-_Voelkerball_dodge_ball_.html");
    }

    async book(email: string, password: string) {
        // click on book
        await this.#click("[name=BS_Kursid_101861]");
        // wait a bit and get the newly opened page
        await this.#page.waitForTimeout(2000);
        const pages = await this.#browser.pages();
        this.#page = pages[pages.length - 1];
        // click on book
        await this.#click("input[value=buchen]", true);
        // click on "i wanna login"
        await this.#click("[id=bs_pw_anmlink]");
        // fill in email
        await this.#page.focus('input[name=email]');
        await this.#page.keyboard.type(email);
        // fill in password
        await this.#page.focus('input[type=password]');
        await this.#page.keyboard.type(password);
        // submit
        await this.#click("input[title='Continue booking']", true);
        // check all the checkboxes
        await this.#page.$$eval("input[type='checkbox']", (checks) => checks.forEach((c: HTMLInputElement) => c.checked = true));
        // submit again
        await this.#click("input[title='Continue booking']", true);
        // submit again
        await this.#click("input[type=submit]", true);
    }

    async get_course(id: number): Promise<Course> {
        return Course.fromElement(this.#page, id);
    }

    async wait(ms: number) {
        return this.#page.waitForTimeout(ms);
    }

    async screenshot(path: string) {
        return this.#page.screenshot({
            fullPage: true,
            path: path
        });
    }

    async reload() {
        return this.#page.reload({ waitUntil: 'networkidle2' });
    }
}