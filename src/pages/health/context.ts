import { createContext, useContext } from 'react';

export interface HealthCtx {
  /** Increments on every simulation tick so views re-render. */
  version: number;
  /** Selected model per equipment tag (detail page tabs). */
  selected: Record<string, string>;
  selectModel: (tag: string, modelId: string) => void;
  openEquipment: (tag: string) => void;
  openModel: (modelId: string) => void;
}
export const HealthContext = createContext<HealthCtx | null>(null);
export const useHealth = () => useContext(HealthContext)!;
