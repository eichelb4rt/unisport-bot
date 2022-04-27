import fs from 'fs';

export class Bookings {
    readonly #jsonPath = 'bookings.json';
    // map from course names to all booked dates in this course
    #bookings: { [course: number]: string[] };

    constructor() {
        this.#bookings = {};
        if (!fs.existsSync(this.#jsonPath)) {
            return;
        }

        const bookingsJSON = JSON.parse(fs.readFileSync(this.#jsonPath, 'utf-8'));
        for (const course of bookingsJSON) {
            this.#bookings[course.course_number] = course.booked_dates;
        }
    }

    isBooked(course: number, date: string): boolean {
        const bookedDates = this.#bookings[course];
        if (!bookedDates) return false;
        return bookedDates.includes(date);
    }

    book(course: number, date: string) {
        // don't do anything if it's already booked
        if (this.isBooked(course, date)) return;
        // create an array if nothing is booked yet
        if (!this.#bookings[course]) this.#bookings[course] = [];
        // push the booked date
        this.#bookings[course].push(date);
        // and save it
        fs.writeFileSync(this.#jsonPath, this.#toJSON());
    }

    #toJSON() {
        const bookingsJSON = [];
        for (const course in this.#bookings) {
            bookingsJSON.push({
                "course_number": course,
                "booked_dates": this.#bookings[course]
            });
        }
        return JSON.stringify(bookingsJSON, null, 2);
    }
}