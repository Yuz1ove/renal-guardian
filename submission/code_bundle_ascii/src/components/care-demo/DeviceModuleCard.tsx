import { bedsideHelpEvent, modeNarratives, wearablePacket } from "./demoFlowData";
import type { DemoMode } from "./scenePresets";

export function DeviceModuleCard({ mode }: { mode: DemoMode }) {
  const copy = modeNarratives[mode];

  return (
    <section className="module-card" aria-label="展示模式說明">
      <div>
        <span>Current module</span>
        <strong>{copy.title}</strong>
      </div>
      <p>{copy.body}</p>
      <ul>
        {copy.chips.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {mode === "wearable" ? (
        <pre>{JSON.stringify(wearablePacket, null, 2)}</pre>
      ) : null}
      {mode === "bedside" ? (
        <pre>{JSON.stringify(bedsideHelpEvent, null, 2)}</pre>
      ) : null}
      {mode === "team" ? (
        <ol>
          <li>A-203｜Critical｜立即關注｜HR 52 / SpO2 93 / 床邊求助</li>
          <li>A-118｜Warning｜30 分鐘內追蹤｜活動量下降</li>
          <li>A-076｜Stable｜例行觀察｜生命徵象穩定</li>
        </ol>
      ) : null}
    </section>
  );
}
