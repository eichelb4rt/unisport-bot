import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { Scheduler } from './scheduler.js';
import { CourseInfo } from './course.js';

puppeteer.use(StealthPlugin());

const COURSES_PATH = 'courses.json';

(async () => {
    // read course pages
    if (!fs.existsSync(COURSES_PATH)) {
        console.log(`You need a '${COURSES_PATH}' file!`);
        return;
    }
    const coursesInfo = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf-8')) as CourseInfo[];

    // create scheduler
    const scheduler = new Scheduler();
    for (const courseInfo of coursesInfo) {
        scheduler.add(courseInfo);
    }
    // start booking stuff and so on
    scheduler.startLoop();
})();