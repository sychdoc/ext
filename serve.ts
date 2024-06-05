const DIST_PATH = "./dist";


console.info("Starting bun extension server at port: 8000");

Bun.serve({
    port: 8000,
    async fetch(req) {
        const filePath = DIST_PATH + new URL(req.url).pathname;
        const file = Bun.file(filePath);

        const res = new Response(file);
        res.headers.set('Access-Control-Allow-Origin', '*');
        res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        return res;
    },
    error() {
        return new Response(null, { status: 404 });
    }
})