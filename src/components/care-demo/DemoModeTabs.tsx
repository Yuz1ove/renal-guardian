import { BellRing, LayoutDashboard, Network, Watch } from "lucide-react";
import { scenePresets, type DemoMode } from "./scenePresets";

const iconByMode = {
  overview: Network,
  wearable: Watch,
  bedside: BellRing,
  team: LayoutDashboard
};

export function DemoModeTabs({
  mode,
  onChange
}: {
  mode: DemoMode;
  onChange: (mode: DemoMode) => void;
}) {
  const modes: DemoMode[] = ["overview", "wearable", "bedside", "team"];

  return (
    <nav className="demo-mode-tabs" aria-label="流程視角">
      {modes.map((item) => {
        const Icon = iconByMode[item];
        const preset = scenePresets[item];
        return (
          <button key={item} type="button" className={mode === item ? "is-active" : ""} onClick={() => onChange(item)}>
            <Icon size={17} />
            <span>{preset.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
