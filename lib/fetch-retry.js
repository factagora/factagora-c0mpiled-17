// One retry when the connection drops ("fetch failed"); timeouts and HTTP errors are not retried.
async function fetchRetry(url, opts) {
  try {
    return await fetch(url, opts);
  } catch (e) {
    if (e.name === "TimeoutError") throw e;
    return fetch(url, opts);
  }
}

module.exports = { fetchRetry };
