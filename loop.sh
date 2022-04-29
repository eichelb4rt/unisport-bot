#!/bin/bash

while true; do
    node build/index.js --unhandled-rejections=strict
    echo "now i wait..."
    sleep 1800
done
