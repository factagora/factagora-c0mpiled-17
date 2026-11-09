// Best-effort per-client limit so one client cannot run up the LLM bill. Counts reset every window; state is in memory.
function createLimiter({ max, windowMs, now = Date.now }) {
  const hits = new Map(); // key -> { start, count }
  return function allow(key) {
    const t = now();
    for (const [k, v] of hits) if (t - v.start >= windowMs) hits.delete(k);
    const hit = hits.get(key);
    if (!hit) {
      hits.set(key, { start: t, count: 1 });
      return true;
    }
    hit.count += 1;
    return hit.count <= max;
  };
}

// Azure puts the client address last in x-forwarded-for; earlier entries come from the client and can be faked.
function clientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] ?? "").split(",").pop().trim();
  return forwarded.replace(/:\d+$/, "") || req.socket.remoteAddress || "unknown";
}

module.exports = { createLimiter, clientKey };
