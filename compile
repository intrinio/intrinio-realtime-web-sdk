rm -rf tmp
rm -rf dist
mkdir tmp
mkdir dist
babel ./src/index.js -o ./tmp/source.js
touch ./dist/intrinio-realtime.js
cat ./src/polyfills/promise.js >> ./dist/intrinio-realtime.js
cat ./tmp/source.js >> ./dist/intrinio-realtime.js
