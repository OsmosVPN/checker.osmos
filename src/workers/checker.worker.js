// Web Worker: проверяет серверы разными методами

// ── TCP probe: fetch no-cors (Image недоступен в воркере)
function tcpProbe(host, port, timeoutMs) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      resolve(null);
    }, timeoutMs);

    fetch(`https://${host}:${port}/`, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(() => {
        clearTimeout(timer);
        const latency = Math.max(10, Math.round(performance.now() - t0));
        resolve(latency);
      })
      .catch((e) => {
        clearTimeout(timer);
        const elapsed = performance.now() - t0;
        if (e.name !== "AbortError") {
          const latency = Math.max(10, Math.round(elapsed));
          resolve(latency);
        } else {
          resolve(null);
        }
      });
  });
}

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
      done({ success: false });
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
      done({ success: ms < 2500, ms });
    };
    ws.onclose = () => {
      const ms = Math.max(10, Math.round(performance.now() - t0));
      done({ success: false, ms });
    };
  });
}

// ── TCP: одна проба
// Используется для SS/Trojan/HY2 - даёт ПРИБЛИЗИТЕЛЬНЫЕ результаты
// (HY2 использует QUIC/HTTP3, SS и Trojan требуют протокол-специфичной обработки)
async function checkTCP(id, host, port) {
  const ms = await tcpProbe(host, port, 4000);
  if (ms !== null)
    return { id, online: true, latency: ms, isApproximate: true };
  return { id, online: false, latency: null, isApproximate: true };
}

// ── DNS+WS: WebSocket + Cloudflare DNS параллельно
// Используется для VLESS/VMess - ТОЧНЫЕ результаты
// (HY2 использует QUIC/HTTP3, браузер не может проверить - нужен backend)
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

const CHECK_FN = { ws: checkWS, tcp: checkTCP };

self.onmessage = async (e) => {
  const { type, configs, batchSize = 14, method = "ws" } = e.data;
  if (type !== "CHECK") return;

  for (let i = 0; i < configs.length; i += batchSize) {
    const batch = configs.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((c) => {
        // HY2, SS, Trojan всегда проверяются TCP методом (приблизительно)
        const isApproxProtocol = ["HY2", "SS", "Trojan"].includes(c.protocol);
        const check = isApproxProtocol
          ? checkTCP
          : (CHECK_FN[method] ?? checkWS);
        return check(c.id, c.host, c.port);
      }),
    );
    self.postMessage({ type: "BATCH_RESULT", results });
  }
  self.postMessage({ type: "DONE" });
};
