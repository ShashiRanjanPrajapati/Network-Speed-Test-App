"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("nst-theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      id="theme-toggle-btn"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "99px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--muted)",
        fontSize: "12px",
        fontWeight: 500,
        cursor: "pointer",
        boxShadow: "var(--shadow-sm)",
        transition: "all 0.2s ease",
      }}
    >
      {dark ? <Sun size={13} /> : <Moon size={13} />}
      {dark ? "Light" : "Dark"}
    </button>
  );
}
