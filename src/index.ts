import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { Scheduler } from './scheduler.js';
import { Courses } from './course.js';

puppeteer.use(StealthPlugin());

(async () => {
    // create scheduler
    const scheduler = new Scheduler();
    for (const courseInfo of Courses.info) {
        scheduler.add(courseInfo);
    }
    // start booking stuff and so on
    scheduler.startLoop();
})();