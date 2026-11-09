const http = require("node:http");

const port = process.env.PORT || 3000;

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>factagora-c0mpiled-17</h1>");
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
