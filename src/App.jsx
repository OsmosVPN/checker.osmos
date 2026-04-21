import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Background from "./components/Background";
import ConfigList from "./components/ConfigList";
import Header from "./components/Header";
import SettingsPanel from "./components/SettingsPanel";
import StatsPanel from "./components/StatsPanel";
import { ALL_SUBS, useConfigs } from "./hooks/useConfigs";

const DEFAULT_SETTINGS = {
  subUrls: ALL_SUBS,
  manualConfigs: "",
  checkMethod: "ws",
};

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [filter, setFilter] = useState("all");

  const {
    configs,
    loading,
    checking,
    paused,
    error,
    loadAndCheck,
    pauseCheck,
    resumeCheck,
    stats,
  } = useConfigs();

  const filteredConfigs = configs.filter((c) => {
    if (filter === "online") return c.status === "online";
    if (filter === "offline") return c.status === "offline";
    return true;
  });

  const isLoading = loading || checking;

  const handleLoad = () => {
    loadAndCheck({
      subUrls: settings.subUrls,
      manualRaw: settings.manualConfigs,
      checkMethod: settings.checkMethod,
    });
  };

  const handleMainAction = () => {
    if (loading || checking) {
      pauseCheck();
      return;
    }

    if (paused) {
      resumeCheck();
      return;
    }

    handleLoad();
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Background />
      <Header />

      <main
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          padding: "28px 16px 60px",
          maxWidth: "860px",
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Status label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "11px",
            letterSpacing: "0.1em",
            color: "rgba(232,244,248,0.35)",
          }}
        >
          <StatusIndicator loading={isLoading} />
          {loading
            ? "ЗАГРУЗКА КОНФИГОВ..."
            : checking
              ? "ПРОВЕРКА СЕРВЕРОВ..."
              : paused
                ? "ПРОВЕРКА НА ПАУЗЕ"
                : configs.length > 0
                  ? "ГОТОВО"
                  : "ОЖИДАНИЕ ЗАПУСКА"}
        </motion.div>

        {/* Stats */}
        <StatsPanel stats={stats} filter={filter} onFilterChange={setFilter} />

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <LoadButton
            onClick={handleMainAction}
            disabled={false}
            isLoading={isLoading}
            isPaused={paused}
          />

          <SettingsToggleButton
            settingsOpen={settingsOpen}
            onClick={() => setSettingsOpen((v) => !v)}
          />
        </motion.div>

        {/* Settings */}
        <AnimatePresence>
          {settingsOpen && (
            <SettingsPanel
              settings={settings}
              onSettingsChange={setSettings}
              onApply={handleLoad}
              disabled={isLoading}
            />
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: "12px 16px",
                background: "rgba(255,77,106,0.08)",
                border: "1px solid rgba(255,77,106,0.28)",
                borderRadius: "10px",
                color: "#FF4D6A",
                fontSize: "13px",
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
              }}
            >
              <span>⚠</span>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Config list */}
        {configs.length > 0 && (
          <ConfigList
            configs={filteredConfigs}
            total={configs.length}
            onlineConfigs={configs.filter((c) => c.status === "online")}
          />
        )}

        {/* Empty state */}
        {!isLoading && configs.length === 0 && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              textAlign: "center",
              padding: "70px 20px",
              color: "rgba(232,244,248,0.25)",
              lineHeight: 1.7,
            }}
          >
            <div
              style={{ fontSize: "44px", marginBottom: "18px", opacity: 0.6 }}
            >
              ⬡
            </div>
            <div
              style={{
                fontSize: "15px",
                marginBottom: "6px",
                color: "rgba(232,244,248,0.4)",
              }}
            >
              Готов к запуску проверки
            </div>
            <div style={{ fontSize: "13px" }}>
              Нажмите «Начать», чтобы загрузить конфиги с текущими настройками
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function StatusIndicator({ loading }) {
  if (!loading) {
    return (
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(232,244,248,0.2)",
        }}
      />
    );
  }
  return (
    <motion.div
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 0.8, repeat: Infinity }}
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "#00F2FF",
      }}
    />
  );
}

function LoadButton({ onClick, disabled, isLoading, isPaused }) {
  const label = isLoading
    ? "❚❚ Остановить"
    : isPaused
      ? "▶ Продолжить"
      : "▶ Начать";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{
        flex: "1 1 180px",
        padding: "13px 24px",
        background: disabled
          ? "rgba(0,242,255,0.05)"
          : "linear-gradient(135deg, rgba(0,242,255,0.2) 0%, rgba(112,255,219,0.12) 100%)",
        border: "1px solid",
        borderColor: disabled ? "rgba(0,242,255,0.1)" : "rgba(0,242,255,0.5)",
        borderRadius: "10px",
        color: disabled ? "rgba(232,244,248,0.25)" : "#00F2FF",
        fontWeight: "600",
        fontSize: "13px",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        transition: "all 0.3s ease",
        boxShadow: disabled
          ? "none"
          : "0 0 24px rgba(0,242,255,0.15), inset 0 1px 0 rgba(0,242,255,0.1)",
        cursor: disabled ? "not-allowed" : "pointer",
        backdropFilter: "blur(10px)",
      }}
    >
      {label}
    </motion.button>
  );
}

function SettingsToggleButton({ settingsOpen, onClick }) {
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

  return (
    <button
      onClick={onClick}
      aria-label="Настройки"
      title="Настройки"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconOnly ? "0" : "6px",
        width: iconOnly ? "46px" : "auto",
        padding: iconOnly ? "13px" : "13px 18px",
        background: settingsOpen
          ? "rgba(112,255,219,0.08)"
          : "rgba(255,255,255,0.04)",
        border: "1px solid",
        borderColor: settingsOpen
          ? "rgba(112,255,219,0.4)"
          : "rgba(0,242,255,0.12)",
        borderRadius: "10px",
        color: settingsOpen ? "#70FFDB" : "rgba(232,244,248,0.5)",
        fontWeight: "500",
        fontSize: "13px",
        letterSpacing: "0.04em",
        backdropFilter: "blur(10px)",
        transition: "all 0.25s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {iconOnly ? "⚙" : `⚙ Настройки ${settingsOpen ? "▲" : "▼"}`}
    </button>
  );
}
