# unisport-bot

Automatically signs into desired Unisport-Course.

## Usage

Fill `config.json` with your credentials like in [`config-template.json`](config-template.json), then

```text
// install dependencies for puppeteer
sudo apt-get install libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libgbm-dev

// install dependencies for node project
npm i

// build and run
npm run start
```

if you want to have the bot check/book every 30 minutes

```text
bash start_loop.sh
```

if you want to stop the loop

```text
screen -X -S unisport-bot quit
```
