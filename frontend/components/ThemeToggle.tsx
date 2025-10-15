// components/ThemeToggle.tsx
"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") {
      setDark(false);
      document.documentElement.classList.remove("dark-mode");
    } else if (stored === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark-mode");
    } else {
      // по умолчанию из prefers-color-scheme
      const m = window.matchMedia("(prefers-color-scheme: dark)");
      if (m.matches) {
        setDark(true);
        document.documentElement.classList.add("dark-mode");
      }
    }
  }, []);

  const toggle = () => {
    if (dark) {
      document.documentElement.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="fixed top-4 right-4 bg-accent-primary text-white p-2 rounded-full shadow-lg hover:bg-accent-secondary transition-colors"
    >
      {dark ? "🌞" : "🌙"}
    </button>
  );
}
