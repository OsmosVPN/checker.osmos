// Web Worker: проверяет серверы через DNS+WS

// ── Cloudflare DNS-over-HTTPS
async function checkDNS(domain) {
  try {
    const clean = domain.replace(/[^a-zA-Z0-9.-]/g, "");
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(clean)}&type=A`,
      {
        headers: { Accept: "application/dns-json" },
        method: "GET",
        mode: "cors",
      },
    );
    if (!r.ok) return { success: false };
    const data = await r.json();
    if (data.Answer?.length > 0) {
      const hasIP = data.Answer.some(
        (a) =>
          a.data &&
          (a.data.match(/^\d+\.\d+\.\d+\.\d+$/) || a.data.includes(":")),
      );
      return { success: hasIP };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

// ── WebSocket handshake
function checkWSHandshake(host, port) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    // Всегда используем wss:// — на HTTPS странице ws:// блокируется браузером
    let settled = false;
    const done = (r) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const timer = setTimeout(() => {
      try {
        ws.close();
      } catch {
        /**/
      }
      done({ success: false });
    }, 3000);
    const ws = new WebSocket(`wss://${host}:${port}`);
    ws.onopen = () => {
      clearTimeout(timer);
      ws.close();
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: true, ms });
    };
    ws.onerror = () => {
      clearTimeout(timer);
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: ms < 2500, ms });
    };
    ws.onclose = () => {
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: false, ms });
    };
  });
}

// ── DNS+WS: WebSocket + Cloudflare DNS параллельно
async function checkWS(id, host, port) {
  const t0 = performance.now();
  const [wsR, dnsR] = await Promise.all([
    checkWSHandshake(host, port),
    checkDNS(host),
  ]);
  if (wsR.success && wsR.ms)
    return { id, online: true, latency: wsR.ms, isApproximate: false };
  if (dnsR.success && wsR.ms && wsR.ms < 2500)
    return { id, online: true, latency: wsR.ms, isApproximate: false };
  if (dnsR.success) {
    const ms = Math.max(10, Math.round(performance.now() - t0));
    return { id, online: true, latency: ms, isApproximate: false };
  }
  return { id, online: false, latency: null, isApproximate: false };
}

self.onmessage = async (e) => {
  const { type, configs, batchSize = 14 } = e.data;
  if (type !== "CHECK") return;

  console.log(`[Worker] Starting check: ${configs.length} configs`);

  for (let i = 0; i < configs.length; i += batchSize) {
    const batch = configs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((c) => checkWS(c.id, c.host, c.port)),
    );
    console.log(
      `[Worker] Batch ${i / batchSize + 1} done:`,
      results.filter((r) => r.online).length,
      "online /",
      results.length,
    );
    self.postMessage({ type: "BATCH_RESULT", results });
  }
  self.postMessage({ type: "DONE" });
};
