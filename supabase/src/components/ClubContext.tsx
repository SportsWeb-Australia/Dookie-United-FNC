import { createContext, useContext } from "react";
import type { ClubConfig, DesignVariant } from "../content/types";

interface ClubContextValue {
  club: ClubConfig;
  variant: DesignVariant;
  setVariant: (v: DesignVariant) => void;
}

export const ClubContext = createContext<ClubContextValue | null>(null);

export function useClub(): ClubContextValue {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error("useClub must be used within ClubContext.Provider");
  return ctx;
}
