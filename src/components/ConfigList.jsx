import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useVirtualScroll } from "../hooks/useVirtualScroll";
import ConfigItem from "./ConfigItem";

const ITEM_HEIGHT = 62; // px per row (padding + content + gap)
const CONTAINER_H = 520; // must match maxHeight below

export default function ConfigList({ configs, total, onlineConfigs }) {
  const {
    containerRef,
    onScroll,
    startIdx,
    endIdx,
    totalHeight,
    offsetTop,
    offsetBottom,
  } = useVirtualScroll({
    itemCount: configs.length,
    itemHeight: ITEM_HEIGHT,
    containerH: CONTAINER_H,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      {/* List header */}
      <div
        style={{
          padding: "11px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(0,242,255,0.08)",
          borderBottom: "1px solid rgba(0,242,255,0.05)",
          borderRadius: "16px 16px 0 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.1em",
            color: "rgba(232,244,248,0.4)",
          }}
        >
          КОНФИГИ
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "12px",
              fontFamily: "'Space Grotesk', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                color:
                  onlineConfigs && onlineConfigs.length > 0
                    ? "rgba(0,255,157,0.85)"
                    : "rgba(232,244,248,0.25)",
              }}
            >
              {onlineConfigs ? onlineConfigs.length : 0}
            </span>
            <span style={{ color: "rgba(232,244,248,0.2)" }}>/</span>
            <span style={{ color: "rgba(0,242,255,0.65)" }}>{total}</span>
          </span>
          {onlineConfigs && <ExportButtons onlineConfigs={onlineConfigs} />}
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={containerRef}
        onScroll={onScroll}
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(0,242,255,0.08)",
          borderTop: "none",
          borderRadius: "0 0 16px 16px",
          height: configs.length === 0 ? "auto" : `${CONTAINER_H}px`,
          overflowY: "auto",
          padding: "8px",
          boxSizing: "border-box",
        }}
      >
        {configs.length === 0 ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "rgba(232,244,248,0.28)",
              fontSize: "14px",
            }}
          >
            Нет конфигов для отображения
          </div>
        ) : (
          <div style={{ height: totalHeight, position: "relative" }}>
            {/* Spacer top */}
            {offsetTop > 0 && <div style={{ height: offsetTop }} />}

            {/* Visible items */}
            {configs.slice(startIdx, endIdx + 1).map((config, i) => (
              <div
                key={config.id}
                style={{
                  height: ITEM_HEIGHT,
                  paddingBottom: "5px",
                  boxSizing: "border-box",
                }}
              >
                <ConfigItem config={config} index={startIdx + i} />
              </div>
            ))}

            {/* Spacer bottom */}
            {offsetBottom > 0 && <div style={{ height: offsetBottom }} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ExportButtons({ onlineConfigs }) {
  const [copied, setCopied] = useState(false);
  const [iconOnly, setIconOnly] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 600px)").matches
      : false,
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 600px)");
    const onChange = (e) => setIconOnly(e.matches);

    media.addEventListener("change", onChange);

    return () => media.removeEventListener("change", onChange);
  }, []);

  const getText = () => onlineConfigs.map((c) => c.raw).join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const handleSave = () => {
    const blob = new Blob([getText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "osmos-checker.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const btnStyle = (active, disabled) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: iconOnly ? "0" : "5px",
    padding: iconOnly ? "4px" : "4px 9px",
    width: iconOnly ? "30px" : "auto",
    background: active ? "rgba(0,255,157,0.1)" : "rgba(0,242,255,0.06)",
    border: "1px solid",
    borderColor: active ? "rgba(0,255,157,0.3)" : "rgba(0,242,255,0.18)",
    borderRadius: "6px",
    color: disabled
      ? "rgba(232,244,248,0.2)"
      : active
        ? "#00FF9D"
        : "rgba(0,242,255,0.8)",
    fontSize: "11px",
    fontWeight: "500",
    letterSpacing: "0.04em",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.2s",
    flexShrink: 0,
  });

  return (
    <div style={{ display: "flex", gap: "5px" }}>
      <button
        onClick={handleCopy}
        disabled={onlineConfigs.length === 0}
        style={btnStyle(copied, onlineConfigs.length === 0)}
        title={`Скопировать ${onlineConfigs.length} онлайн-конфигов`}
        aria-label="Копировать"
      >
        {iconOnly ? (
          <CopyActionIcon copied={copied} />
        ) : (
          <>
            <CopyActionIcon copied={copied} />
            <span>{copied ? "Скопировано" : "Копировать"}</span>
          </>
        )}
      </button>
      <button
        onClick={handleSave}
        disabled={onlineConfigs.length === 0}
        style={btnStyle(false, onlineConfigs.length === 0)}
        title={`Скачать ${onlineConfigs.length} онлайн-конфигов`}
        aria-label="Сохранить"
      >
        {iconOnly ? "↓" : "↓ Сохранить"}
      </button>
    </div>
  );
}

function CopyActionIcon({ copied }) {
  if (copied) {
    return (
      <svg
        width="12"
        height="12"
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
      width="12"
      height="12"
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
