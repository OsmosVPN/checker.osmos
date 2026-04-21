import { motion } from "framer-motion";
import { memo, useState } from "react";

const PROTOCOL_COLORS = {
  VLESS: "#00F2FF",
  VMess: "#70FFDB",
  Trojan: "#FFB347",
  SS: "#FF6B9D",
  HY2: "#A78BFA",
};

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

export default memo(function ConfigItem({ config }) {
  const [copied, setCopied] = useState(false);
  const color = PROTOCOL_COLORS[config.protocol] || "#00F2FF";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(config.raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const latencyColor = !config.latency
    ? "rgba(232,244,248,0.35)"
    : config.latency < 500
      ? "#00FF9D"
      : config.latency < 1500
        ? "#FFB347"
        : "#FF4D6A";

  return (
    <div
      style={{
        height: "100%",
        padding: "12px 14px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(0,242,255,0.07)",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "background 0.15s, border-color 0.15s",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        e.currentTarget.style.borderColor = "rgba(0,242,255,0.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        e.currentTarget.style.borderColor = "rgba(0,242,255,0.07)";
      }}
    >
      {/* Status indicator */}
      <StatusDot status={config.status} />

      {/* Protocol badge */}
      <span
        style={{
          padding: "2px 7px",
          background: `rgba(${hexToRgb(color)},0.12)`,
          border: `1px solid rgba(${hexToRgb(color)},0.3)`,
          borderRadius: "5px",
          fontSize: "10px",
          fontWeight: "700",
          color,
          letterSpacing: "0.04em",
          flexShrink: 0,
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {config.protocol}
      </span>

      {/* Name + host */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: "500",
            color: "rgba(232,244,248,0.88)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {config.name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "rgba(232,244,248,0.32)",
            marginTop: "2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {config.host}:{config.port}
        </div>
      </div>

      {/* Latency / offline */}
      {config.status === "offline" ? (
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'Space Grotesk', sans-serif",
            color: "rgba(255,77,106,0.7)",
            flexShrink: 0,
          }}
        >
          offline
        </span>
      ) : config.latency != null ? (
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'Space Grotesk', sans-serif",
            color: latencyColor,
            flexShrink: 0,
          }}
        >
          {config.latency}ms
        </span>
      ) : null}

      {/* Copy */}
      <button
        onClick={handleCopy}
        title="Скопировать конфиг"
        style={{
          display: "flex",
          alignItems: "center",
          padding: "5px 9px",
          background: copied ? "rgba(0,255,157,0.1)" : "rgba(0,242,255,0.06)",
          border: "1px solid",
          borderColor: copied ? "rgba(0,255,157,0.3)" : "rgba(0,242,255,0.14)",
          borderRadius: "6px",
          color: copied ? "#00FF9D" : "rgba(232,244,248,0.45)",
          fontSize: "12px",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        <CopyActionIcon copied={copied} />
      </button>
    </div>
  );
});

function CopyActionIcon({ copied }) {
  if (copied) {
    return (
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function StatusDot({ status }) {
  if (status === "online") {
    return (
      <div
        style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}
      >
        <motion.div
          animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#00FF9D",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#00FF9D",
            boxShadow: "0 0 6px #00FF9D",
          }}
        />
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#FF4D6A",
          flexShrink: 0,
          boxShadow: "0 0 6px rgba(255,77,106,0.5)",
        }}
      />
    );
  }
  if (status === "checking") {
    return (
      <motion.div
        animate={{ opacity: [1, 0.25, 1] }}
        transition={{ duration: 0.9, repeat: Infinity }}
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "rgba(0,242,255,0.6)",
          flexShrink: 0,
        }}
      />
    );
  }
  if (status === "paused") {
    return (
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "rgba(255,179,71,0.85)",
          flexShrink: 0,
          boxShadow: "0 0 6px rgba(255,179,71,0.45)",
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: "rgba(232,244,248,0.15)",
        flexShrink: 0,
      }}
    />
  );
}
