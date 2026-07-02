import { useMemo, useState } from "react";
import { BlueprintConnector } from "./BlueprintConnector";
import { ModuleInfoPanel } from "./DiagramAnnotations";
import { braceletModules } from "./assistiveDeviceData";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function connectorColor(tone: string) {
  if (tone === "critical") return "#c94b4b";
  if (tone === "warning") return "#d6a441";
  if (tone === "sync") return "#2f8f86";
  return "#4ea69d";
}

export function BraceletDiagram() {
  const [activeModuleId, setActiveModuleId] = useState(braceletModules[0].id);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | undefined>();
  const focusedModuleId = hoveredModuleId ?? activeModuleId;
  const visibleModule = useMemo(
    () =>
      braceletModules.find((item) => item.id === focusedModuleId) ??
      braceletModules[0],
    [focusedModuleId]
  );

  return (
    <section className="assistive-section blueprint-section" aria-label="監測手環剖面圖">
      <header className="assistive-section-header blueprint-section-header">
        <div>
          <span>Device 01 / Hardware Cutaway</span>
          <h3>監測手環剖面圖</h3>
          <p>智慧手錶式監測手環採螢幕朝上剖面，標出玻璃、螢幕、PCB、電池、底部貼膚感測器與側邊求助鍵。</p>
        </div>
        <strong>12 個硬體模組</strong>
      </header>

      <div className="blueprint-workspace">
        <div className="blueprint-diagram-surface bracelet-cutaway-surface">
          <svg className="blueprint-connector-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {braceletModules.map((item, index) => (
              <BlueprintConnector
                key={item.id}
                sourceAnchor={{ x: item.position.markerX, y: item.position.markerY }}
                targetAnchor={{ x: item.position.lineEndX, y: item.position.lineEndY }}
                color={connectorColor(item.tone)}
                status={item.tone}
                selected={item.id === focusedModuleId}
                dimmed={item.id !== focusedModuleId}
                labelId={`${item.id}-label`}
                moduleId={item.id}
                laneOffset={(index % 3) * 1.6}
              />
            ))}
          </svg>

          <div className="bracelet-cutaway-device" aria-hidden="true">
            <span className="watch-strap watch-strap-left">
              <i />
              <i />
            </span>
            <span className="watch-strap watch-strap-right">
              <i />
              <i />
            </span>
            <div className="watch-case">
              <span className="watch-gasket-part">12</span>
              <span className="watch-side-help-button">11</span>
              <div className="watch-layer watch-glass-layer">
                <span>01</span>
                <b>Touch Glass</b>
              </div>
              <div className="watch-layer watch-oled-layer">
                <span>02</span>
                <b>OLED Panel</b>
              </div>
              <div className="watch-layer watch-pcb-layer">
                <span className="pcb-board">
                  <b>03 MCU</b>
                  <i className="pcb-chip ble-chip-part">04 BLE</i>
                  <i className="pcb-chip buffer-chip-part">05 SYNC</i>
                  <i className="pcb-trace trace-a" />
                  <i className="pcb-trace trace-b" />
                </span>
              </div>
              <div className="watch-layer watch-battery-layer">
                <span className="battery-pack">06</span>
                <span className="vibration-part">07</span>
                <span className="accelerometer-part">08</span>
              </div>
              <div className="watch-sensor-layer">
                <span className="sensor-window ppg-window">
                  <b>09</b>
                  <i />
                </span>
                <span className="sensor-window spo2-window">
                  <b>10</b>
                  <i />
                </span>
              </div>
            </div>
          </div>

          {braceletModules.map((item) => (
            <button
              key={`${item.id}-marker`}
              type="button"
              className={classNames(
                "blueprint-marker",
                `tone-${item.tone}`,
                item.id === focusedModuleId && "is-active",
                item.id !== focusedModuleId && "is-muted"
              )}
              style={{ left: `${item.position.markerX}%`, top: `${item.position.markerY}%` }}
              onMouseEnter={() => setHoveredModuleId(item.id)}
              onMouseLeave={() => setHoveredModuleId(undefined)}
              onFocus={() => setHoveredModuleId(item.id)}
              onBlur={() => setHoveredModuleId(undefined)}
              onClick={() => setActiveModuleId(item.id)}
              aria-label={item.title}
            >
              {String(item.index).padStart(2, "0")}
            </button>
          ))}

          {braceletModules.map((item) => (
            <button
              key={`${item.id}-label`}
              type="button"
              className={classNames(
                "blueprint-label",
                item.position.cardX < 50 ? "is-left" : "is-right",
                `tone-${item.tone}`,
                item.id === focusedModuleId && "is-active",
                item.id !== focusedModuleId && "is-muted"
              )}
              style={{ left: `${item.position.cardX}%`, top: `${item.position.cardY}%` }}
              onMouseEnter={() => setHoveredModuleId(item.id)}
              onMouseLeave={() => setHoveredModuleId(undefined)}
              onFocus={() => setHoveredModuleId(item.id)}
              onBlur={() => setHoveredModuleId(undefined)}
              onClick={() => setActiveModuleId(item.id)}
            >
              <b>{String(item.index).padStart(2, "0")}</b>
              <span>{item.title}</span>
              <small>{item.description}</small>
              <i>
                {item.fields.map((field) => (
                  <code key={field}>{field}</code>
                ))}
              </i>
            </button>
          ))}
        </div>

        <div className="diagram-side-stack">
          <ModuleInfoPanel module={visibleModule} locked={!hoveredModuleId} />
        </div>
      </div>
    </section>
  );
}
