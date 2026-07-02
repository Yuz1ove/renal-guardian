import type { ReactNode } from "react";

export function AppShell({ scene, panel }: { scene: ReactNode; panel: ReactNode }) {
  return (
    <main className="app-shell">
      <section className="scene-region">{scene}</section>
      {panel}
    </main>
  );
}
