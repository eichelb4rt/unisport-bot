# unisport-bot

Automatically signs into desired Unisport-Course.

## Usage

Fill `config.json` with your credentials like in [`config-template.json`](config-template.json):

```json
{
	"course_url": "https://www.hochschulsportbuchung.uni-jena.de/angebote/aktueller_zeitraum/_UNISPORT_Card_-_Zweifelder-_Voelkerball_dodge_ball_.html",
	"course_number": 10016,
	"enable_booking": true,
	"credentials": {
		"mail": "<MAIL>",
		"password": "<PASSWORD>"
	}
}
```

install dependencies for puppeteer

```text
sudo apt-get install libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgtk-3-0 libgbm-dev
```

install dependencies for node project

```text
npm i
```

build and run

```text
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
