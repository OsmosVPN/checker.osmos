import { motion } from "framer-motion";

const MotionDiv = motion.div;
const MotionButton = motion.button;

export default function SettingsPanel({
  settings,
  onSettingsChange,
  onApply,
  disabled,
}) {
  const set = (key, val) =>
    onSettingsChange((prev) => ({ ...prev, [key]: val }));

  const subUrls = settings.subUrls ?? [];

  const setUrl = (i, val) => {
    const next = [...subUrls];
    next[i] = val;
    set("subUrls", next);
  };

  const addUrl = () => set("subUrls", [...subUrls, ""]);

  const removeUrl = (i) =>
    set(
      "subUrls",
      subUrls.filter((_, idx) => idx !== i),
    );

  return (
    <MotionDiv
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {/* ─── Источники ─── */}
        <Section label="ИСТОЧНИКИ КОНФИГОВ" color="rgba(0,242,255,0.6)">
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {subUrls.map((url, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "6px", alignItems: "center" }}
              >
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(i, e.target.value)}
                  placeholder="https://example.com/sub?token=..."
                  autoComplete="off"
                  spellCheck={false}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
                {subUrls.length > 1 && (
                  <button
                    onClick={() => removeUrl(i)}
                    title="Удалить"
                    style={{
                      flexShrink: 0,
                      width: 30,
                      height: 30,
                      background: "rgba(255,77,106,0.1)",
                      border: "1px solid rgba(255,77,106,0.25)",
                      borderRadius: "7px",
                      color: "#FF4D6A",
                      fontSize: "15px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addUrl}
              style={{
                alignSelf: "flex-start",
                padding: "5px 12px",
                background: "rgba(0,242,255,0.06)",
                border: "1px dashed rgba(0,242,255,0.25)",
                borderRadius: "7px",
                color: "rgba(0,242,255,0.6)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              + добавить подписку
            </button>
          </div>

          <Field
            label="Свои конфиги"
            hint="Вставить конфиги вручную (vless://...)"
          >
            <textarea
              value={settings.manualConfigs}
              onChange={(e) => set("manualConfigs", e.target.value)}
              placeholder={"vless://...\ntrojan://...\nss://..."}
              rows={4}
              spellCheck={false}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "88px",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: 1.5,
              }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </Field>
        </Section>

        {/* ─── Применить ─── */}
        <MotionButton
          onClick={onApply}
          disabled={disabled}
          whileHover={!disabled ? { scale: 0.98 } : {}}
          whileTap={!disabled ? { scale: 0.96 } : {}}
          style={{
            padding: "13px",
            width: "100%",
            boxSizing: "border-box",
            background: disabled
              ? "rgba(0,242,255,0.04)"
              : "linear-gradient(135deg, rgba(0,242,255,0.18) 0%, rgba(112,255,219,0.1) 100%)",
            border: "1px solid",
            borderColor: disabled
              ? "rgba(0,242,255,0.1)"
              : "rgba(0,242,255,0.5)",
            borderRadius: "12px",
            color: disabled ? "rgba(232,244,248,0.25)" : "#00F2FF",
            fontWeight: "600",
            fontSize: "13px",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            cursor: disabled ? "not-allowed" : "pointer",
            backdropFilter: "blur(10px)",
            boxShadow: disabled ? "none" : "0 0 20px rgba(0,242,255,0.12)",
            transition: "all 0.2s",
          }}
        >
          ▶ Начать с этими параметрами
        </MotionButton>
      </div>
    </MotionDiv>
  );
}

function Section({ label, color, children }) {
  return (
    <div
      style={{
        padding: "16px",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(0,242,255,0.08)",
        borderRadius: "14px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          letterSpacing: "0.12em",
          color,
          fontWeight: "600",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
        <span
          style={{
            fontSize: "12px",
            color: "rgba(232,244,248,0.6)",
            fontWeight: "500",
          }}
        >
          {label}
        </span>
        {hint && (
          <span style={{ fontSize: "11px", color: "rgba(232,244,248,0.28)" }}>
            — {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 13px",
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(0,242,255,0.14)",
  borderRadius: "9px",
  color: "rgba(232,244,248,0.9)",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
};

function focusInput(e) {
  e.target.style.borderColor = "rgba(0,242,255,0.45)";
  e.target.style.boxShadow = "0 0 14px rgba(0,242,255,0.08)";
}
function blurInput(e) {
  e.target.style.borderColor = "rgba(0,242,255,0.14)";
  e.target.style.boxShadow = "none";
}

function hexToRgb(hex) {
  if (hex.startsWith("#")) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }
  return "0,242,255";
}
