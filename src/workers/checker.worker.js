// Web Worker: проверяет серверы через WS + DNS

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
    if (!r.ok) return false;
    const data = await r.json();
    return (
      data.Answer?.some(
        (a) =>
          a.data &&
          (a.data.match(/^\d+\.\d+\.\d+\.\d+$/) || a.data.includes(":")),
      ) ?? false
    );
  } catch {
    return false;
  }
}

// ── WebSocket handshake
// Используем wss:// для 443/8443, ws:// для остальных (как на референсном сайте)
function checkWSHandshake(host, port) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const proto = port === 443 || port === 8443 ? "wss" : "ws";
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
      done({ success: false, ms: 3000 });
    }, 3000);
    const ws = new WebSocket(`${proto}://${host}:${port}`);
    ws.onopen = () => {
      clearTimeout(timer);
      ws.close();
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: true, ms });
    };
    ws.onerror = () => {
      clearTimeout(timer);
      const ms = Math.max(10, Math.round(performance.now() - t0));
      // Быстрый ответ (< 2500 мс) = сервер живой, просто WS не поддерживается
      done({ success: ms < 2500, ms });
    };
    ws.onclose = () => {
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: false, ms });
    };
  });
}

// ── WS + DNS
// Сервер онлайн если:
//   1. WS handshake прошёл (onopen), ИЛИ
//   2. WS onerror быстро (< 2500 мс) + DNS резолвится (домен), ИЛИ
//   3. DNS резолвится (домен существует), ИЛИ
//   4. IP-адрес + WS onerror быстро (< 1500 мс) — у IP нет DNS-оверхеда,
//      быстрый ответ = сервер реально ответил (connection refused = порт открыт)
function isIP(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":");
}

async function checkWS(id, host, port) {
  const ipHost = isIP(host);

  const [wsR, dnsOk] = await Promise.all([
    checkWSHandshake(host, port),
    ipHost ? Promise.resolve(false) : checkDNS(host),
  ]);

  if (wsR.success && wsR.ms)
    return { id, online: true, latency: wsR.ms, isApproximate: false };
  if (dnsOk && wsR.ms && wsR.ms < 2500)
    return { id, online: true, latency: wsR.ms, isApproximate: false };
  if (dnsOk)
    return { id, online: true, latency: wsR.ms ?? null, isApproximate: true };
  // Для IP: быстрый onerror = сервер ответил (нет DNS-задержки, поэтому порог ниже)
  if (ipHost && wsR.ms < 1500)
    return { id, online: true, latency: wsR.ms, isApproximate: true };

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
