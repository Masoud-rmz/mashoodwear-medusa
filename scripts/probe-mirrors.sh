#!/usr/bin/env bash
curl -sI --max-time 20 https://nodejs.org/dist/v20.18.3/node-v20.18.3-linux-x64.tar.xz | head -3
echo "---nodesource---"
curl -sI --max-time 20 https://deb.nodesource.com | head -3
echo "---fnm---"
curl -sI --max-time 20 https://github.com/Schniz/fnm/releases/download/v1.38.1/fnm-linux.zip | head -3
