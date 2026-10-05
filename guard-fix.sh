#!/bin/sh
set -e
cp app.js public/app.js
cp app.js dist/app.js
cp app.js isolate/app.js
cp index.html dist/index.html
cp index.html isolate/index.html
echo "guard-fix: public/app.js dist/app.js isolate/app.js ve dist/index.html isolate/index.html senkronize edildi"
