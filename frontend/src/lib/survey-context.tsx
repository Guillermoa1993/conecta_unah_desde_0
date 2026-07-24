import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type PendingSurvey = { eventId: string; eventTitle: string } | null;

interface SurveyContextValue {
  pending: PendingSurvey;
  triggerSurvey: (eventId: string, eventTitle: string) => void;
  dismissSurvey: () => void;
}

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingSurvey>(null);

  const triggerSurvey = useCallback((eventId: string, eventTitle: string) => {
    setPending({ eventId, eventTitle });
  }, []);
  const dismissSurvey = useCallback(() => setPending(null), []);

  return (
    <SurveyContext.Provider value={{ pending, triggerSurvey, dismissSurvey }}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used inside SurveyProvider");
  return ctx;
}
