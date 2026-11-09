const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { TIMEPOINTS, NAMES, appearsAt, spacesOf, hiddenRefs, systemPrompt, screenText } = require("./characters");
const { judgeScored } = require("./scoring");
const { createLeaderboard, createVerdictStore, parseNick } = require("./leaderboard");
const { createLimiter, clientKey } = require("./ratelimit");

const port = process.env.PORT || 3000;
const board = createLeaderboard();
const verdicts = createVerdictStore();
const accuseAllowed = createLimiter({ max: 5, windowMs: 60 * 1000 });

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
  // A null byte makes fs throw, which would take the whole server down.
  if (rel.includes("\0")) return notFound(res);
  const file = path.join(dir, rel);
  if (!file.startsWith(dir + path.sep)) return notFound(res);

  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) return notFound(res);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      // Art in /assets/ changes rarely: let browsers reuse it for an hour and refresh in the background after that.
      "Cache-Control": prefix === "/assets/" ? "public, max-age=3600, stale-while-revalidate=86400" : "no-cache",
    });
    // An unreadable file must end this one response, not crash the server.
    fs.createReadStream(file).on("error", () => res.destroy()).pipe(res);
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
  // Pinned cards the player shows to the character: { text, refs } (refs open locked memories), or plain text.
  const evidence = (b.evidence ?? []);
  const goodRefs = (r) => r === undefined || (Array.isArray(r) && r.length <= 10 && r.every((x) => typeof x === "string" && /^[A-Z]\d{2}$/.test(x)));
  const goodCard = (e) => isText(e, 500) || (e && typeof e === "object" && isText(e.text, 500) && goodRefs(e.refs));
  if (!Array.isArray(evidence) || evidence.length > 10 || !evidence.every(goodCard)) {
    return { error: "evidence must be at most 10 cards of { text, refs } (or text) up to 500 characters." };
  }
  return {
    gameId: b.gameId ?? null,
    character: b.character,
    timepoint: b.timepoint,
    question: b.question.trim(),
    history: history.map(({ role, content }) => ({ role, content })),
    evidence: evidence.map((e) => (typeof e === "string" ? { text: e, refs: [] } : { text: e.text, refs: e.refs || [] })),
  };
}

// One retry when the connection drops ("fetch failed"); timeouts and HTTP errors are not retried.
async function fetchRetry(url, opts) {
  try {
    return await fetch(url, opts);
  } catch (e) {
    if (e.name === "TimeoutError") throw e;
    return fetch(url, opts);
  }
}

// Every memory in a space known as of the time point (spaces are small, so no search; reads are free).
async function readSpace(space, asOf) {
  const items = [];
  let after = null;
  do {
    const q = new URLSearchParams({ as_of: asOf, space, limit: "200", ...(after ? { after } : {}) });
    const res = await fetchRetry(`${TCKG_BASE}/api/${process.env.TCKG_COLLECTION_ID}/v1/memories?${q}`, {
      headers: { Authorization: `Bearer ${process.env.TCKG_TOKEN}` },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`tckg memories returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const page = await res.json();
    items.push(...page.items);
    after = page.next;
  } while (after);
  return items.map((m) => ({ id: m.id, ref: m.payload?.ref, type: m.payload?.type, said: m.asserted_at, statement: m.statement }));
}

async function chat(messages) {
  const res = await fetchRetry(`${process.env.AOAI_ENDPOINT.replace(/\/$/, "")}/openai/v1/chat/completions`, {
    method: "POST",
    headers: { "api-key": process.env.AOAI_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ model: process.env.AOAI_DEPLOYMENT, messages, reasoning_effort: "low", response_format: { type: "json_object" } }),
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
  let all = [];
  try {
    const asOf = TIMEPOINTS[timepoint].asOf;
    all = (await Promise.all(spacesOf(character).map((space) => readSpace(space, asOf)))).flat();
  } catch (e) {
    console.error(JSON.stringify({ event: "tckg_error", gameId, character, timepoint, error: e.message }));
  }
  // Locked memories stay out of the prompt until the pinned cards open them.
  const hidden = hiddenRefs(character, timepoint, evidence.flatMap((e) => e.refs));
  const facts = all.filter((m) => !hidden.has(m.ref)).sort((a, b) => String(a.said).localeCompare(String(b.said)));
  facts.forEach((m, i) => (m.key = `M${i + 1}`));
  const list = (ms, said) => ms.map((m) => `${m.key}. ${said ? `(${String(m.said).slice(0, 4)}) ` : ""}${m.statement}`).join("\n") || "- (없음)";

  let system = `${systemPrompt(character, timepoint)}

[내가 아는 것]
${list(facts.filter((m) => m.type !== "claim"))}

[내가 전에 한 말]
${list(facts.filter((m) => m.type === "claim"), true)}`;
  if (evidence.length) system += `\n\n[형사가 보여 주는 증거]\n${evidence.map((e) => `- ${e.text}`).join("\n")}`;
  system += `\n\n답은 JSON 하나로만 낸다: {"answer": "<대답>", "used": ["<대답에 실제로 쓴 기억 번호, 예: M3>"]}`;

  let answer, used;
  try {
    const raw = await chat([{ role: "system", content: system }, ...history, { role: "user", content: question }]);
    try {
      ({ answer, used } = JSON.parse(raw));
    } catch {
      answer = raw; // ponytail: if the model ever skips JSON, show the text and attach no refs
    }
    if (typeof answer !== "string" || !answer.trim()) throw new Error(`no answer in model output: ${String(raw).slice(0, 200)}`);
  } catch (e) {
    console.error(JSON.stringify({ event: "aoai_error", gameId, character, timepoint, error: e.message }));
    return sendJson(res, 502, { error: "The character could not answer. Try again." });
  }
  // Refs of the memories the answer used; the browser keeps them on the turn so a pinned card can open locks.
  const usedSet = new Set(Array.isArray(used) ? used : []);
  const refs = [...new Set(facts.filter((m) => usedSet.has(m.key) && m.ref).map((m) => m.ref))];

  // Conversation log. Azure keeps stdout in the app's log stream.
  console.log(JSON.stringify({ event: "ask", gameId, character, timepoint, question, evidence, answer: answer.trim(), refs, hidden: [...hidden], facts: facts.length, ms: Date.now() - started }));
  sendJson(res, 200, { answer: answer.trim(), refs });
}

// Judges the accusation (right or wrong culprit, motive score 1-100). The player's memo is read as the motive. The response keeps the shape the game screen reads and adds
// a verdictId to register the score later. With a nick it registers right away and there is no verdictId.
async function handleAccuse(req, res) {
  const started = Date.now();
  if (!accuseAllowed(clientKey(req))) return sendJson(res, 429, { error: "Too many accusations. Wait a minute and try again." });
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }
  const { nick, error } = parseNick(body?.nick);
  if (error) return sendJson(res, 400, { error });

  const result = await judgeScored(body?.who, body?.memo ?? body?.motive, {
    chat,
    onFallback: (e) => console.error(JSON.stringify({ event: "scoring_fallback", error: e.message })),
  });
  if (!result) return sendJson(res, 400, { error: "Send a suspect id (who) and the memo text." });

  // The board ranks the total score (culprit + motive), the same number the verdict screen shows.
  const entry = nick ? board.add({ nick, ending: result.ending, score: result.total_score }) : null;
  const verdictId = nick ? null : verdicts.save({ ending: result.ending, score: result.total_score });
  console.log(JSON.stringify({ event: "accuse", who: body.who, nick, ending: result.ending, score: result.score, total_score: result.total_score, source: result.source, rank: entry?.rank ?? null, ms: Date.now() - started }));
  sendJson(res, 200, { ...screenText(result), verdictId, entry });
}

// Registers a judged verdict under a nick. The score comes from the stored verdict, so the browser cannot choose it.
async function handleRegister(req, res) {
  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return sendJson(res, 400, { error: e.message });
  }
  const { nick, error } = parseNick(body?.nick);
  if (error || !nick) return sendJson(res, 400, { error: error ?? "Send a nick." });
  const verdict = verdicts.claim(body?.verdictId);
  if (!verdict) return sendJson(res, 404, { error: "Unknown, used or expired verdictId. Accuse again to get a new one." });

  const entry = board.add({ nick, ending: verdict.ending, score: verdict.score });
  console.log(JSON.stringify({ event: "score_registered", nick, ending: verdict.ending, score: verdict.score, rank: entry.rank }));
  sendJson(res, 200, { entry, total: board.top(1).total });
}

function handle(req, res) {
  let url;
  try {
    url = new URL(req.url, "http://localhost");
  } catch {
    return sendJson(res, 400, { error: "Bad request URL." });   // e.g. "GET http://[ HTTP/1.1" makes new URL throw
  }
  const { pathname, searchParams } = url;

  if (pathname === "/api/characters") {
    const timepoints = Object.entries(TIMEPOINTS).map(([id, t]) => ({ id, label: t.label }));
    const characters = Object.fromEntries(Object.entries(NAMES).map(([id, name]) => [id, { name: id === "kim" ? "Ken Kim" : screenText(name), timepoints: timepointsOf(id) }]));
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
    return handleAccuse(req, res).catch((e) => {
      console.error(JSON.stringify({ event: "accuse_failed", error: e.message }));
      if (!res.headersSent) sendJson(res, 500, { error: "Something went wrong." });
    });
  }
  if (pathname === "/api/scores") {
    if (req.method === "GET") {
      const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit"), 10) || 100));
      return sendJson(res, 200, board.top(limit));
    }
    if (req.method !== "POST") return sendJson(res, 405, { error: "Use GET or POST." });
    return handleRegister(req, res).catch((e) => {
      console.error(JSON.stringify({ event: "register_failed", error: e.message }));
      if (!res.headersSent) sendJson(res, 500, { error: "Something went wrong." });
    });
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

module.exports = { parseAsk, handle };
