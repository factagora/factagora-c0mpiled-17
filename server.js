const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const port = process.env.PORT || 3000;

const DS_PREFIX = "/design-system/";
const DS_DIR = path.join(__dirname, "design-system");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
};

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function serveDesignSystem(pathname, res) {
  let rel;
  try {
    rel = decodeURIComponent(pathname.slice(DS_PREFIX.length)) || "index.html";
  } catch {
    return notFound(res);
  }
  const file = path.join(DS_DIR, rel);
  if (!file.startsWith(DS_DIR + path.sep)) return notFound(res);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "public, max-age=300",
    });
    fs.createReadStream(file).pipe(res);
  });
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");

    if (pathname === "/design-system") {
      res.writeHead(301, { Location: DS_PREFIX });
      return res.end();
    }
    if (pathname.startsWith(DS_PREFIX)) return serveDesignSystem(pathname, res);

    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end('<h1>factagora-c0mpiled-17</h1><p><a href="/design-system/">Design system</a></p>');
    }
    notFound(res);
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
