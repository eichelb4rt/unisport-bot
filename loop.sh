#!/bin/bash

while true; do
    node --unhandled-rejections=strict build/index.js
    echo "$(date +"%d.%m.%Y %T"): now i wait..."
    sleep 1800
done
