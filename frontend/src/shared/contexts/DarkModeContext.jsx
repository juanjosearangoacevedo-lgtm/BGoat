import { createContext, useContext, useState, useEffect } from "react";
const DarkModeContext = createContext({
  dark: false,
  toggleDark: () => {
  }
});
function DarkModeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("ge-dark-mode") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [dark]);
  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("ge-dark-mode", String(next));
      } catch {
      }
      return next;
    });
  };
  return <DarkModeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </DarkModeContext.Provider>;
}
function useDarkMode() {
  return useContext(DarkModeContext);
}
export {
  DarkModeProvider,
  useDarkMode
};
