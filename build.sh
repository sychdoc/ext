rm -rf dist/request
mkdir -p dist/request
bun build src/request.tsx --minify --outfile dist/request/request.js

rm -rf dist/tldraw
mkdir -p dist/tldraw
bun build src/tldraw.tsx --minify --outfile dist/tldraw/tldraw.js