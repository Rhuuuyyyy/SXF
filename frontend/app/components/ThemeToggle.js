"use client";

import { useState, useEffect } from "react";
import Icons from "./Icons";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme = document.documentElement.getAttribute("data-theme");
    setIsDark(theme === "dark");
  }, []);

  function toggle() {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("cito-theme", next);
    } catch (_) {}
    setIsDark(!isDark);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Alternar tema"
      className="h-10 w-[68px] rounded-full lift flex items-center px-1 relative flex-shrink-0"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--hair)",
      }}
    >
      {/* Sun icon (right side, visible in dark mode) */}
      <span
        className="absolute right-2 flex items-center justify-center"
        style={{ color: "var(--subtle)" }}
      >
        {Icons.sun}
      </span>

      {/* Moon icon (left side, visible in light mode) */}
      <span
        className="absolute left-2 flex items-center justify-center"
        style={{ color: "var(--subtle)" }}
      >
        {Icons.moon}
      </span>

      {/* Sliding pill */}
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center absolute lift"
        style={{
          background: "var(--ink)",
          color: "var(--on-ink)",
          left: isDark ? "calc(100% - 36px)" : "4px",
          transition: "left 0.2s ease",
          zIndex: 1,
        }}
      >
        {isDark ? Icons.moon : Icons.sun}
      </span>
    </button>
  );
}
