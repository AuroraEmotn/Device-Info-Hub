import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Lang, LANGUAGES } from "./i18n";

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "rtl" | "ltr";
}

const LangContext = createContext<LangContextValue>({ lang: "ar", setLang: () => {}, dir: "rtl" });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang");
    return (saved as Lang) ?? "ar";
  });

  const dir = LANGUAGES.find(l => l.code === lang)?.dir ?? "rtl";

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return <LangContext.Provider value={{ lang, setLang, dir }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);