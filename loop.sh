#!/bin/bash

while true; do
    node --unhandled-rejections=strict build/index.js
    echo "$(date +"%d.%m.%Y %T"): restarting in 2 hours..."
    # wait 2 hrs if script is stopped
    sleep 7200
done
