rm -rf dist/request
mkdir -p dist/request
bun build src/request.tsx --outfile dist/request/request.js --minify --minify-syntax --minify-whitespace \
    --minify-identifiers

rm -rf dist/tldraw
mkdir -p dist/tldraw
bun build src/tldraw.tsx --outfile dist/tldraw/tldraw.js --minify --minify-syntax --minify-whitespace \
    --minify-identifiers

rm -rf dist/graphviz
mkdir -p dist/graphviz
bun build src/graphviz.ts --outfile dist/graphviz/graphviz.js --minify --minify-syntax --minify-whitespace \
    --minify-identifiers
      