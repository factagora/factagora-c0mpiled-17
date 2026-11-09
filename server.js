const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { TIMEPOINTS, NAMES, appearsAt, spacesOf, systemPrompt } = require("./characters");
const { judge } = require("./accuse");

const port = process.env.PORT || 3000;

const GAME_FILE = path.join(__dirname, "game", "index.html");
const STATIC = {
  "/client/": path.join(__dirname, "client"),
  "/assets/": path.join(__dirname, "game", "assets"),   // portraits, backgrounds, item icons
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".json": "application/json; charset=utf-8",
};

const TCKG_BASE = "https://tckg.app.factagora.com";
const MAX_BODY = 64 * 1024;

function notFound(res) {
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function serveStatic(prefix, pathname, res) {
  const dir = STATIC[prefix];
  let rel;
  try {
    rel = decodeURIComponent(pathname.slice(prefix.length)) || "index.html";
  } catch {
    return notFound(res);
  }
  const file = path.join(dir, rel);
  if (!file.startsWith(dir + path.sep)) return notFound(res);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "Cache-Control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size <= MAX_BODY) chunks.push(chunk);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return reject(new Error("The request body is too large."));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("The request body is not valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

const timepointsOf = (character) => Object.keys(TIMEPOINTS).filter((t) => appearsAt(character, t));

const isText = (v, max) => typeof v === "string" && v.trim() !== "" && v.length <= max;

// Checks the request from the browser. Returns the clean fields or { error }.
function parseAsk(b) {
  if (!b || typeof b !== "object") return { error: "Send a JSON object." };
  if (!Object.hasOwn(NAMES, b.character)) {
    return { error: `character must be one of: ${Object.keys(NAMES).join(", ")}.` };
  }
  if (!Object.hasOwn(TIMEPOINTS, b.timepoint) || !appearsAt(b.character, b.timepoint)) {
    return { error: `${b.character} is only at these time points: ${timepointsOf(b.character).join(", ")}.` };
  }
  if (!isText(b.question, 500)) return { error: "question must be text of 1 to 500 characters." };
  if (b.gameId !== undefined && !isText(b.gameId, 64)) return { error: "gameId must be text of up to 64 characters." };

  const history = b.history ?? [];
  const goodTurn = (t) => t && (t.role === "user" || t.role === "assistant") && isText(t.content, 2000);
  if (!Array.isArray(history) || history.length > 20 || !history.every(goodTurn)) {
    return { error: "history must be at most 20 items of { role: user | assistant, content }." };
  }
  // Pinned cards from other time points that the player shows to the character.
  const evidence = b.evidence ?? [];
  if (!Array.isArray(evidence) || evidence.length > 10 || !evidence.every((e) => isText(e, 500))) {
    return { error: "evidence must be at most 10 texts of up to 500 characters." };
  }
  return {
    gameId: b.gameId ?? null,
    character: b.character,
    timepoint: b.timepoint,
    question: b.question.trim(),
    history: history.map(({ role, content }) => ({ role, content })),
    evidence,
  };
}

// The time point decides as_of, so a 2016 call only sees what was known in 2016.
async function searchSpace(space, asOf, query) {
  const res = await fetch(`${TCKG_BASE}/api/${process.env.TCKG_COLLECTION_ID}/v1/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.TCKG_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, as_of: asOf, space, limit: 8 }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`tckg search returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).hits.map((h) => ({ id: h.node.id, statement: h.node.statement }));
}

async function chat(messages) {
  const res = await fetch(`${process.env.AOAI_ENDPOINT.replace(/\/$/, "")}/openai/v1/chat/completions`, {
    method: "POST",
    headers: { "api-key": process.env.AOAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.AOAI_DEPLOYMENT, messages, reasoning_effort: "low" }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`AOAI returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).choices[0].message.content.trim();
}

async function handleAsk(req, res) {
  const started = Date.now();
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }
  const ask = parseAsk(body);
  if (ask.error) return sendJson(res, 400, ask);
  const { gameId, character, timepoint, question, history, evidence } = ask;

  // ponytail: a tckg failure still lets the character answer (with no memories) so the demo keeps going; the log shows it.
  let facts = [];
  try {
    const asOf = TIMEPOINTS[timepoint].asOf;
    facts = (await Promise.all(spacesOf(character).map((space) => searchSpace(space, asOf, question)))).flat();
  } catch (e) {
    console.error(JSON.stringify({ event: "tckg_error", gameId, character, timepoint, error: e.message }));
  }

  const memories = facts.map((f) => `- ${f.statement}`).join("\n") || "- (떠오르는 것이 없다)";
  // Korean question -> Korean answer; anything else (the English game screen) -> English.
  const lang = /[가-힣]/.test(question) ? "한국어" : "영어";
  let system = `${systemPrompt(character, timepoint, lang)}\n\n[기억]\n${memories}`;
  if (evidence.length) system += `\n\n[형사가 보여 주는 증거]\n${evidence.map((e) => `- ${e}`).join("\n")}`;

  let answer;
  try {
    answer = await chat([{ role: "system", content: system }, ...history, { role: "user", content: question }]);
  } catch (e) {
    console.error(JSON.stringify({ event: "aoai_error", gameId, character, timepoint, error: e.message }));
    return sendJson(res, 502, { error: "The character could not answer. Try again." });
  }

  // Conversation log. Azure keeps stdout in the app's log stream.
  console.log(JSON.stringify({ event: "ask", gameId, character, timepoint, question, evidence, answer, facts: facts.map((f) => f.id), ms: Date.now() - started }));
  sendJson(res, 200, { answer });
}

function handle(req, res) {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/api/characters") {
    const timepoints = Object.entries(TIMEPOINTS).map(([id, t]) => ({ id, label: t.label }));
    const characters = Object.fromEntries(Object.entries(NAMES).map(([id, name]) => [id, { name, timepoints: timepointsOf(id) }]));
    return sendJson(res, 200, { timepoints, characters });
  }
  if (pathname === "/api/ask") {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Use POST." });
    return handleAsk(req, res).catch((e) => {
      console.error(JSON.stringify({ event: "ask_failed", error: e.message }));
      if (!res.headersSent) sendJson(res, 500, { error: "Something went wrong." });
    });
  }
  if (pathname === "/api/accuse") {
    if (req.method !== "POST") return sendJson(res, 405, { error: "Use POST." });
    return readJson(req).then(
      (b) => {
        const result = judge(b?.who, b?.motive);
        sendJson(res, result ? 200 : 400, result || { error: "Send a suspect id and a motive." });
      },
      (e) => sendJson(res, 400, { error: e.message })
    );
  }
  const prefix = Object.keys(STATIC).find((p) => pathname.startsWith(p));
  if (prefix) return serveStatic(prefix, pathname, res);

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return fs.createReadStream(GAME_FILE).pipe(res);
  }
  notFound(res);
}

if (require.main === module) {
  http.createServer(handle).listen(port, () => console.log(`http://localhost:${port}`));
}

module.exports = { parseAsk };
