// Azure OpenAI chat completions; the deployment answers in JSON.
const { fetchRetry } = require("./fetch-retry");

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

module.exports = { chat };
