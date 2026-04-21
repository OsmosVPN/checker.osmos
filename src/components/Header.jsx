import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Header() {
  const [instructionOpen, setInstructionOpen] = useState(false);

  useEffect(() => {
    if (!instructionOpen || typeof document === "undefined") return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEsc = (e) => {
      if (e.key === "Escape") setInstructionOpen(false);
    };

    window.addEventListener("keydown", onEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onEsc);
    };
  }, [instructionOpen]);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 10,
          borderBottom: "1px solid rgba(0,242,255,0.07)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            maxWidth: "860px",
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                background:
                  "linear-gradient(135deg, rgba(0,242,255,0.18), rgba(112,255,219,0.12))",
                border: "1px solid rgba(0,242,255,0.28)",
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(0,242,255,0.15)",
                fontSize: "20px",
              }}
            >
              ⬡
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: "700",
                  fontSize: "15px",
                  background: "linear-gradient(90deg, #00F2FF, #70FFDB)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "0.08em",
                }}
              >
                OSMOS · CHECKER
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(232,244,248,0.32)",
                  letterSpacing: "0.1em",
                  marginTop: "1px",
                }}
              >
                v1.0.0 · ЦИФРОВАЯ ДИФФУЗИЯ
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <InstructionButton onClick={() => setInstructionOpen(true)} />

            {/* Telegram link */}
            <TelegramLink />
          </div>
        </div>
      </motion.header>

      <InstructionModal
        open={instructionOpen}
        onClose={() => setInstructionOpen(false)}
      />
    </>
  );
}

function InstructionButton({ onClick }) {
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
      title="Инструкция"
      aria-label="Открыть инструкцию"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconOnly ? "0" : "8px",
        padding: iconOnly ? "8px" : "8px 14px",
        width: iconOnly ? "34px" : "auto",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(0,242,255,0.14)",
        borderRadius: "9px",
        color: "rgba(232,244,248,0.6)",
        fontSize: "13px",
        fontWeight: "500",
        letterSpacing: "0.03em",
        transition: "all 0.25s ease",
        backdropFilter: "blur(10px)",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(112,255,219,0.45)";
        e.currentTarget.style.color = "#70FFDB";
        e.currentTarget.style.background = "rgba(112,255,219,0.08)";
        e.currentTarget.style.boxShadow = "0 0 16px rgba(112,255,219,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,242,255,0.14)";
        e.currentTarget.style.color = "rgba(232,244,248,0.6)";
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {!iconOnly && <span>Инструкция</span>}
    </button>
  );
}

function InstructionModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(5, 12, 17, 0.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "rgba(15, 28, 36, 0.95)",
          border: "1px solid rgba(0,242,255,0.2)",
          borderRadius: "14px",
          boxShadow: "0 0 38px rgba(0,242,255,0.12)",
          padding: "18px 18px 14px",
          color: "rgba(232,244,248,0.88)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              letterSpacing: "0.04em",
              color: "#70FFDB",
            }}
          >
            Как пользоваться сервисом
          </h3>
          <button
            onClick={onClose}
            aria-label="Закрыть инструкцию"
            style={{
              border: "1px solid rgba(0,242,255,0.2)",
              background: "rgba(0,242,255,0.05)",
              color: "rgba(232,244,248,0.75)",
              borderRadius: "8px",
              width: "28px",
              height: "28px",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <ol style={{ margin: "0 0 14px 18px", padding: 0, lineHeight: 1.7 }}>
          <li>Нажмите «Начать», чтобы загрузить и проверить конфиги</li>
          <li>
            Можете остановить проверку в любой момент, если уже набралось
            достаточно онлайн-конфигов
          </li>
          <li>
            Скопируйте нужный конфиг кнопкой в строке или массово через
            «Копировать» в шапке списка, либо сохраните файлом через «Сохранить»
          </li>
        </ol>

        <div
          style={{
            marginBottom: "14px",
            fontSize: "12px",
            color: "rgba(232,244,248,0.62)",
            lineHeight: 1.6,
          }}
        >
          Подсказка по «Настройкам»: используйте свой список подписок для
          загрузки конфигов, добавляйте свои списки и редактируйте их, или
          используйте ручной ввод, когда нужно проверить конкретные конфиги
          точечно
        </div>

        <h3
          style={{
            margin: 0,
            fontSize: "16px",
            letterSpacing: "0.04em",
            color: "#70FFDB",
            marginBottom: "10px",
          }}
        >
          Как добавить конфиги в приложение
        </h3>

        <ol style={{ margin: "0 0 12px 18px", padding: 0, lineHeight: 1.7 }}>
          <li>
            Откройте ваше VPN-приложение (например: Happ proxy, v2rayNG, v2rayN,
            Hiddify, Nekoray, Shadowrocket)
          </li>
          <li>
            Выберите один из способов импорта профиля:
            <ul>
              <li>Импорт из буфера обмена / Clipboard</li>
              <li>Импорт из файла (если вы сохранили конфиг)</li>
            </ul>
          </li>
          <li>После импорта выберите профиль и нажмите «Подключиться»</li>
          <li>Если не подключается — попробуйте другой конфиг из списка</li>
        </ol>

        <div
          style={{
            fontSize: "12px",
            color: "rgba(232,244,248,0.56)",
            borderTop: "1px solid rgba(0,242,255,0.12)",
            paddingTop: "10px",
            marginBottom: "14px",
          }}
        >
          Подсказка: название кнопок в разных клиентах может немного отличаться,
          но логика всегда одна — импорт и активация профиля
        </div>

        <div
          style={{
            padding: "12px 10px",
            background: "rgba(112,255,219,0.05)",
            border: "1px solid rgba(112,255,219,0.15)",
            borderRadius: "10px",
            fontSize: "12px",
            color: "rgba(232,244,248,0.72)",
            lineHeight: 1.6,
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: "12px",
              letterSpacing: "0.04em",
              color: "#70FFDB",
            }}
          >
            ℹ Об источниках конфигураций
          </h4>
          <p style={{ margin: "0 0 6px 0" }}>
            <strong>Все конфигурации</strong> в этом приложении взяты и
            агрегированы из <strong>открытых источников</strong> (GitHub
            репозитории). Приложение не создает и не хранит собственные
            конфигурации, а только загружает, проверяет и помогает вам выбрать
            рабочие конфиги.
          </p>
          <p style={{ margin: "0" }}>
            Основные источники:{" "}
            <span style={{ color: "rgba(112,255,219,0.8)" }}>
              EtoNeYaProject, zieng2/wl, igareck, ByeWhiteLists, RKPchannel
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function TelegramLink() {
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
    <a
      href="https://t.me/osmosvpn"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: iconOnly ? "0" : "8px",
        padding: iconOnly ? "8px" : "8px 14px",
        width: iconOnly ? "34px" : "auto",
        background: "rgba(0,242,255,0.05)",
        border: "1px solid rgba(0,242,255,0.14)",
        borderRadius: "9px",
        color: "rgba(232,244,248,0.5)",
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: "500",
        transition: "all 0.25s ease",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,242,255,0.4)";
        e.currentTarget.style.color = "#00F2FF";
        e.currentTarget.style.background = "rgba(0,242,255,0.1)";
        e.currentTarget.style.boxShadow = "0 0 16px rgba(0,242,255,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,242,255,0.14)";
        e.currentTarget.style.color = "rgba(232,244,248,0.5)";
        e.currentTarget.style.background = "rgba(0,242,255,0.05)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-2.016 9.504c-.148.658-.537.818-1.088.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.13.883.717z" />
      </svg>
      <span style={{ display: "none" }}>@osmosvpn</span>
      {!iconOnly && <span>Подписаться</span>}
    </a>
  );
}
