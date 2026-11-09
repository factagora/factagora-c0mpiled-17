const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = process.env.PORT || 3000;
const GAME_FILE = path.join(__dirname, "game", "index.html");

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");

    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return fs.createReadStream(GAME_FILE).pipe(res);
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
