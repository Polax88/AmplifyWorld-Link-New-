'use client';

import { createContext, useContext, type ReactNode } from 'react';

interface DashboardContextValue {
  aiWizardEnabled: boolean;
  viberateEnabled: boolean;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

/**
 * Seeded from the server layout (which has the real session user id, so the
 * feature flag's rollout percentage buckets per-user correctly) and read by
 * client components below it — avoids a second client-side flag round-trip
 * and a "global bucket" flag evaluation that would make percentage rollouts
 * meaningless (either everyone gets it or no one does).
 */
export function DashboardProvider({
  aiWizardEnabled,
  viberateEnabled,
  children,
}: DashboardContextValue & { children: ReactNode }) {
  return (
    <DashboardContext.Provider value={{ aiWizardEnabled, viberateEnabled }}>{children}</DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboardContext must be used within DashboardProvider');
  return context;
}
