import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
const key = "peoplehub-theme";
function initialTheme() {
  try {
    const saved = localStorage.getItem(key);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
const current = document.documentElement.dataset.theme || initialTheme();
document.documentElement.dataset.theme = current;
export default function ThemeToggle() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme);
  useEffect(() => {
    const sync = () => setTheme(document.documentElement.dataset.theme);
    window.addEventListener("peoplehub-theme", sync);
    return () => window.removeEventListener("peoplehub-theme", sync);
  }, []);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(key, next);
    } catch {}
    setTheme(next);
    window.dispatchEvent(new Event("peoplehub-theme"));
  }
  return (
    <button
      className="theme-toggle"
      aria-label={
        "Switch to " + (theme === "dark" ? "light" : "dark") + " theme"
      }
      aria-pressed={theme === "dark"}
      onClick={toggle}
    >
      <span
        className={theme === "light" ? "theme-option active" : "theme-option"}
      >
        <Sun size={14} />
        <span>Light</span>
      </span>
      <span
        className={theme === "dark" ? "theme-option active" : "theme-option"}
      >
        <Moon size={14} />
        <span>Dark</span>
      </span>
    </button>
  );
}
