import fs from 'fs';
import { exit } from 'process';

export namespace Config {
    const CONFIG_PATH = 'config.json';

    // read config
    if (!fs.existsSync(CONFIG_PATH)) {
        console.log(`You need a '${CONFIG_PATH}' file!`);
        exit(1);
    }
    const configJSON = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

    export const enable_booking: boolean = configJSON.enable_booking;
    export const mail: string = configJSON.credentials.mail;
    export const password: string = configJSON.credentials.password;
}