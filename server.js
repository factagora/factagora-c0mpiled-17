const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { judge } = require("./accuse");

const port = process.env.PORT || 3000;
const GAME_FILE = path.join(__dirname, "game", "index.html");

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");

    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      return fs.createReadStream(GAME_FILE).pipe(res);
    }
    if (pathname === "/api/accuse" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => {
        body += chunk;
        if (body.length > 10000) req.destroy();   // the form never sends this much
      });
      req.on("end", () => {
        let result = null;
        try {
          const { who, motive } = JSON.parse(body);
          result = judge(who, motive);
        } catch {}
        res.writeHead(result ? 200 : 400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(result || { error: "Send a suspect id and a motive." }));
      });
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
