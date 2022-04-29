"use strict";

import fs from 'fs';

export class Config {
    readonly course_url: string
    readonly course_number: number
    readonly enable_booking: boolean
    readonly mail: string
    readonly password: string

    constructor(configPath: string) {
        const configJSON = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        this.course_url = configJSON.course_url;
        this.course_number = configJSON.course_number;
        this.enable_booking = configJSON.enable_booking;
        this.mail = configJSON.credentials.mail;
        this.password = configJSON.credentials.password;
    }
}