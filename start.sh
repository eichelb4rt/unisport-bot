#!/bin/bash

cd "$(dirname "$0")" || exit
npm run build
screen -dm -S 'unisport-bot' node --unhandled-rejections=strict build/index.js
