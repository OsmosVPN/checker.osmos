import { useCallback, useRef, useState } from "react";
import CheckerWorker from "../workers/checker.worker.js?worker";

export const ALL_SUBS = [
  "https://raw.githubusercontent.com/EtoNeYaProject/etoneyaproject.github.io/refs/heads/main/whitelist",
  "https://raw.githubusercontent.com/zieng2/wl/main/vless_universal.txt",
  "https://raw.githubusercontent.com/igareck/vpn-configs-for-russia/refs/heads/main/WHITE-CIDR-RU-checked.txt",
  "https://raw.githubusercontent.com/ByeWhiteLists/ByeWhiteLists2/refs/heads/main/ByeWhiteLists2.txt",
  "https://raw.githubusercontent.com/RKPchannel/RKP_bypass_configs/refs/heads/main/configs/url_work.txt",
];

// Backward-compat export
export const DEFAULT_SUB_URL = ALL_SUBS[0];

const PROXIES = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  (u) => `https://thingproxy.freeboard.io/fetch/${u}`,
  (u) => `https://cors.bridged.cc/${u}`,
  (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  (u) =>
    `https://api.cors-anywhere.com/` +
    u.split("://")[1].split("/")[0] +
    "/" +
    u.split("/").slice(3).join("/"),
];

// Проверяет, является ли строка IPv4-адресом
function isIPv4(host) {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

// Возвращает true для адресов, недостижимых из браузера
function isPrivateOrReservedIP(host) {
  if (!isIPv4(host)) return false;
  const parts = host.split(".").map(Number);
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    a >= 224
  );
}

function isValidHost(host) {
  if (!host || typeof host !== "string") return false;
  const h = host.trim();
  if (!h) return false;
  // Отсекаем приватные/зарезервированные IP
  if (isPrivateOrReservedIP(h)) return false;
  // hostname должен быть хотя бы одним символом и не состоять только из точек/дефисов
  if (/^[-.]+$/.test(h)) return false;
  // Минимально: домен вида a.b или IP — хотя бы одна точка или это не голая цифра
  if (/^\d+$/.test(h)) return false;
  return true;
}

function isValidPort(port) {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

function shouldSkipHost(host) {
  const h = host?.trim().toLowerCase();
  return h === "localhost" || h === "127.0.0.1";
}

function parseConfig(line) {
  line = line.trim();
  if (!line || line.startsWith("#")) return null;

  try {
    if (line.startsWith("vless://")) {
      const url = new URL(line);
      const host = url.hostname;
      const port = parseInt(url.port) || 443;
      if (!isValidHost(host) || !isValidPort(port)) return null;
      return {
        id: crypto.randomUUID(),
        protocol: "VLESS",
        name: decodeURIComponent(url.hash.slice(1)) || host,
        host,
        port,
        raw: line,
        status: "pending",
        latency: null,
      };
    }
    if (line.startsWith("trojan://")) {
      const url = new URL(line);
      const host = url.hostname;
      const port = parseInt(url.port) || 443;
      if (!isValidHost(host) || !isValidPort(port)) return null;
      return {
        id: crypto.randomUUID(),
        protocol: "Trojan",
        name: decodeURIComponent(url.hash.slice(1)) || host,
        host,
        port,
        raw: line,
        status: "pending",
        latency: null,
      };
    }
    if (line.startsWith("ss://")) {
      const hashIdx = line.indexOf("#");
      const name =
        hashIdx !== -1 ? decodeURIComponent(line.slice(hashIdx + 1)) : "";
      const withoutHash = hashIdx !== -1 ? line.slice(0, hashIdx) : line;
      const atIdx = withoutHash.lastIndexOf("@");
      if (atIdx !== -1) {
        const hostPort = withoutHash.slice(atIdx + 1);
        const lastColon = hostPort.lastIndexOf(":");
        const host = hostPort.slice(0, lastColon);
        const port = parseInt(hostPort.slice(lastColon + 1)) || 443;
        if (!isValidHost(host) || !isValidPort(port)) return null;
        return {
          id: crypto.randomUUID(),
          protocol: "SS",
          name: name || host,
          host,
          port,
          raw: line,
          status: "pending",
          latency: null,
        };
      }
      return null;
    }
    if (line.startsWith("vmess://")) {
      const b64 = line.slice(8);
      const decoded = JSON.parse(atob(b64));
      const host = decoded.add;
      const port = parseInt(decoded.port) || 443;
      if (!isValidHost(host) || !isValidPort(port)) return null;
      return {
        id: crypto.randomUUID(),
        protocol: "VMess",
        name: decoded.ps || host || "Unknown",
        host,
        port,
        raw: line,
        status: "pending",
        latency: null,
      };
    }
    if (line.startsWith("hysteria2://") || line.startsWith("hy2://")) {
      const url = new URL(line);
      const host = url.hostname;
      const port = parseInt(url.port) || 443;
      if (!isValidHost(host) || !isValidPort(port)) return null;
      return {
        id: crypto.randomUUID(),
        protocol: "HY2",
        name: decodeURIComponent(url.hash.slice(1)) || host,
        host,
        port,
        raw: line,
        status: "pending",
        latency: null,
      };
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchSubscription(entry) {
  const url = typeof entry === "string" ? entry : entry.url;
  const limit = typeof entry === "object" && entry.limit ? entry.limit : null;

  const isGitHub = url.includes("github.com");

  let convertedUrl = url;
  if (isGitHub && url.includes("/raw/")) {
    convertedUrl = url
      .replace("github.com/", "raw.githubusercontent.com/")
      .replace("/raw/", "/");
  } else if (isGitHub && url.includes("/blob/")) {
    convertedUrl = url
      .replace("github.com/", "raw.githubusercontent.com/")
      .replace("/blob/", "/");
  }

  let attempts = [];
  if (isGitHub) {
    const otherProxies = PROXIES.filter((p) => {
      const result = p(url);
      return !result.includes("githack") && !result.includes("ghproxy");
    });
    attempts = [
      () => fetch(convertedUrl),
      () => fetch(url),
      ...otherProxies.map((p) => () => fetch(p(url))),
    ];
  } else {
    attempts = [() => fetch(url), ...PROXIES.map((p) => () => fetch(p(url)))];
  }

  let text = null;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      if (!res.ok) continue;
      text = await res.text();
      break;
    } catch {
      /* try next proxy */
    }
  }
  if (text === null) throw new Error(`Не удалось загрузить подписку: ${url}`);

  let content = text.trim();
  try {
    const decoded = atob(content.replace(/\s/g, ""));
    if (decoded.includes("://")) content = decoded;
  } catch {
    /* not base64 */
  }

  if (limit) {
    const lines = content.split(/[\n\r]+/).filter(Boolean);
    content = lines.slice(0, limit).join("\n");
  }

  return content;
}

function sortConfigs(list) {
  const getStatusRank = (status) => {
    if (status === "online") return 0;
    if (status === "checking") return 1;
    if (status === "paused") return 2;
    return 3;
  };

  return [...list].sort((a, b) => {
    const rankA = getStatusRank(a.status);
    const rankB = getStatusRank(b.status);
    if (rankA !== rankB) return rankA - rankB;
    if (a.latency != null && b.latency != null) return a.latency - b.latency;
    if (a.latency != null) return -1;
    if (b.latency != null) return 1;
    return 0;
  });
}

export function useConfigs() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState(null);
  const workerRef = useRef(null);
  const currentConfigsRef = useRef([]);
  const runIdRef = useRef(0);

  const replaceConfigs = useCallback((nextConfigs) => {
    currentConfigsRef.current = nextConfigs;
    setConfigs(nextConfigs);
  }, []);

  const updateConfigs = useCallback((updater) => {
    setConfigs((prev) => {
      const next = updater(prev);
      currentConfigsRef.current = next;
      return next;
    });
  }, []);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const runChecks = useCallback(
    (configsToCheck, runId) => {
      if (configsToCheck.length === 0) {
        setLoading(false);
        setChecking(false);
        setPaused(false);
        return;
      }

      setLoading(false);
      setChecking(true);

      const worker = new CheckerWorker();
      workerRef.current = worker;

      worker.onerror = (err) => {
        console.error("[useConfigs] Worker error:", err);
        if (runId !== runIdRef.current) return;

        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        setChecking(false);
      };

      worker.onmessage = (e) => {
        console.log(
          "[useConfigs] onmessage:",
          e.data?.type,
          "runId:",
          runId,
          "current:",
          runIdRef.current,
        );
        if (runId !== runIdRef.current) {
          console.warn(
            "[useConfigs] runId mismatch, ignoring",
            runId,
            "!=",
            runIdRef.current,
          );
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          return;
        }

        const { type, results } = e.data;

        if (type === "BATCH_RESULT") {
          const resultMap = new Map(
            results.map((result) => [result.id, result]),
          );

          updateConfigs((prev) =>
            sortConfigs(
              prev.map((config) => {
                const result = resultMap.get(config.id);
                if (!result) return config;

                return {
                  ...config,
                  status: result.online ? "online" : "offline",
                  latency: result.latency,
                };
              }),
            ),
          );
        }

        if (type === "DONE") {
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
          setChecking(false);
          setPaused(false);
          updateConfigs((prev) => sortConfigs(prev));
        }
      };

      worker.postMessage({
        type: "CHECK",
        configs: configsToCheck.map(({ id, host, port }) => ({
          id,
          host,
          port,
        })),
        batchSize: 16,
      });
    },
    [updateConfigs],
  );

  const loadAndCheck = useCallback(
    async ({ subUrls = [DEFAULT_SUB_URL], manualRaw = "" } = {}) => {
      runIdRef.current += 1;
      const runId = runIdRef.current;

      terminateWorker();

      setLoading(true);
      setChecking(false);
      setPaused(false);
      setError(null);
      replaceConfigs([]);

      let parsedConfigs = [];

      // --- Загрузка всех подписок параллельно ---
      const urls = (Array.isArray(subUrls) ? subUrls : [subUrls]).filter(
        Boolean,
      );
      const results = await Promise.allSettled(urls.map(fetchSubscription));

      // Если уже запустили новый вызов — выходим
      if (runId !== runIdRef.current) return;

      let firstError = null;
      results.forEach((res, i) => {
        if (res.status === "fulfilled") {
          const lines = res.value.split(/[\n\r]+/).filter(Boolean);
          parsedConfigs.push(...lines.map(parseConfig).filter(Boolean));
        } else if (i === 0) {
          firstError = res.reason?.message;
        }
      });

      if (parsedConfigs.length === 0 && firstError) {
        setError(firstError);
        setLoading(false);
        return;
      }

      // --- Ручные конфиги ---
      if (manualRaw?.trim()) {
        const lines = manualRaw.split(/[\n\r]+/).filter(Boolean);
        parsedConfigs.push(...lines.map(parseConfig).filter(Boolean));
      }

      parsedConfigs = parsedConfigs.filter(
        (config) => !shouldSkipHost(config.host),
      );

      // Убираем дубли по host:port (один реальный сервер = один конфиг)
      const seen = new Set();
      parsedConfigs = parsedConfigs.filter((c) => {
        const key = `${c.host.toLowerCase()}:${c.port}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (parsedConfigs.length === 0) {
        setError(
          "Конфиги не найдены. Проверьте URL подписки или вставьте конфиги вручную.",
        );
        setLoading(false);
        return;
      }

      const nextConfigs = sortConfigs(
        parsedConfigs.map((config) => ({ ...config, status: "checking" })),
      );

      replaceConfigs(nextConfigs);
      runChecks(nextConfigs, runId);
    },
    [replaceConfigs, runChecks, terminateWorker],
  );

  const pauseCheck = useCallback(() => {
    runIdRef.current += 1;
    terminateWorker();
    setLoading(false);
    setChecking(false);

    const nextConfigs = sortConfigs(
      currentConfigsRef.current.map((config) =>
        config.status === "checking" ? { ...config, status: "paused" } : config,
      ),
    );

    replaceConfigs(nextConfigs);
    setPaused(nextConfigs.some((config) => config.status === "paused"));
  }, [replaceConfigs, terminateWorker]);

  const resumeCheck = useCallback(() => {
    const pausedConfigs = currentConfigsRef.current.filter(
      (config) => config.status === "paused",
    );

    if (pausedConfigs.length === 0) {
      setPaused(false);
      return;
    }

    runIdRef.current += 1;
    const runId = runIdRef.current;

    const nextConfigs = sortConfigs(
      currentConfigsRef.current.map((config) =>
        config.status === "paused" ? { ...config, status: "checking" } : config,
      ),
    );

    replaceConfigs(nextConfigs);
    setPaused(false);
    runChecks(pausedConfigs, runId);
  }, [replaceConfigs, runChecks]);

  const stats = {
    total: configs.length,
    online: configs.filter((c) => c.status === "online").length,
    offline: configs.filter((c) => c.status === "offline").length,
    checking: configs.filter((c) => c.status === "checking").length,
  };

  return {
    configs,
    loading,
    checking,
    paused,
    error,
    loadAndCheck,
    pauseCheck,
    resumeCheck,
    stats,
  };
}
