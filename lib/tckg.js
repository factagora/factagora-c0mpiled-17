// Reads character memories from tckg (the collection behind the game).
const { fetchRetry } = require("./fetch-retry");

const TCKG_BASE = "https://tckg.app.factagora.com";

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

module.exports = { readSpace };
