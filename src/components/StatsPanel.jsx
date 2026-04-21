import { motion } from "framer-motion";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const STATS = [
  { key: "total", label: "ВСЕГО", filterKey: "all", color: "#00F2FF" },
  { key: "online", label: "ОНЛАЙН", filterKey: "online", color: "#00FF9D" },
  { key: "offline", label: "ОФЛАЙН", filterKey: "offline", color: "#FF4D6A" },
];

export default function StatsPanel({ stats, filter, onFilterChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "12px",
      }}
    >
      {STATS.map(({ key, label, filterKey, color }) => {
        const isActive = filter === filterKey;
        const rgb = hexToRgb(color);

        return (
          <motion.button
            key={key}
            onClick={() => onFilterChange(filterKey)}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "20px 12px",
              background: isActive
                ? `rgba(${rgb},0.12)`
                : "rgba(255,255,255,0.04)",
              border: "1px solid",
              borderColor: isActive ? color : "rgba(0,242,255,0.1)",
              borderRadius: "16px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
              transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
              boxShadow: isActive
                ? `0 0 28px rgba(${rgb},0.18), inset 0 1px 0 rgba(${rgb},0.1)`
                : "none",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                letterSpacing: "0.12em",
                color: isActive ? color : "rgba(232,244,248,0.38)",
                fontWeight: "600",
              }}
            >
              {label}
            </span>

            <motion.span
              key={stats[key]}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                fontSize: "clamp(26px, 5vw, 36px)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: "700",
                color: isActive ? color : "rgba(232,244,248,0.85)",
                lineHeight: 1,
              }}
            >
              {stats[key] ?? "—"}
            </motion.span>

            {/* Glow line */}
            <div
              style={{
                width: "32px",
                height: "2px",
                borderRadius: "1px",
                background: isActive
                  ? `linear-gradient(90deg, transparent, ${color}, transparent)`
                  : "rgba(255,255,255,0.06)",
                transition: "background 0.3s",
              }}
            />
          </motion.button>
        );
      })}
    </motion.div>
  );
}
