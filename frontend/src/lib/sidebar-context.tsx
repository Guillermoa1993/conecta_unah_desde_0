import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SidebarContextProps = {
  expanded: Record<string, boolean>;
  toggle: (label: string) => void;
};

const SidebarContext = createContext<SidebarContextProps | null>(null);

const STORAGE_KEY = "cp-sidebar-expanded";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpanded(JSON.parse(stored));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (Object.keys(expanded).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    }
  }, [expanded]);

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <SidebarContext.Provider value={{ expanded, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarCtx() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarCtx must be used inside SidebarProvider");
  return ctx;
}
