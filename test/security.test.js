const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const net = require("node:net");
const { handle } = require("../server");

// Sends one raw request line, so we can send URLs that an HTTP client library would refuse to build.
function raw(port, requestLine) {
  return new Promise((resolve) => {
    const socket = net.connect(port, "127.0.0.1", () => socket.write(`${requestLine} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`));
    let out = "";
    socket.on("data", (d) => (out += d));
    socket.on("close", () => resolve(out));
    socket.on("error", () => resolve(out));
    setTimeout(() => socket.destroy(), 2000);
  });
}

const statusOf = (response) => Number(/^HTTP\/1\.1 (\d{3})/.exec(response)?.[1] ?? 0);

async function withServer(fn) {
  const server = http.createServer(handle);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await fn(server.address().port);
  } finally {
    server.close();
  }
}

test("requests that used to crash the server get an error response and the server keeps running", async () => {
  await withServer(async (port) => {
    const bad = [
      ["GET /client/%00", 404],           // null byte in a static path
      ["GET /assets/a%00b.png", 404],
      ["GET http://[", 400],              // new URL() throws on this
      ["GET //%", 400],
    ];
    for (const [line, expected] of bad) {
      assert.equal(statusOf(await raw(port, line)), expected, line);
      // the server must still answer after each one
      assert.equal(statusOf(await raw(port, "GET /api/characters")), 200, `still up after: ${line}`);
    }
  });
});

test("static paths cannot reach files outside the client and assets folders", async () => {
  await withServer(async (port) => {
    for (const p of ["/client/../server.js", "/client/%2e%2e/server.js", "/client/..%2fdata/server.json", "/assets/%2e%2e%2f%2e%2e%2f.env.local", "/data/server.json", "/server.js", "/.env"]) {
      const response = await raw(port, `GET ${p}`);
      assert.equal(statusOf(response), 404, p);
      assert.doesNotMatch(response, /solution|AOAI_API_KEY|require\("node:http"\)/, p);
    }
  });
});
