#!/bin/bash

while true; do
    node --unhandled-rejections=strict build/index.js
    echo "now i wait..."
    sleep 1800
done
