#!/bin/bash

cd "$(dirname "$0")" || exit
npm run build
screen -dm -S 'unisport-bot' bash loop.sh
