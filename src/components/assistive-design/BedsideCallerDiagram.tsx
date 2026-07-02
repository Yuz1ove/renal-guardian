import { useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { BlueprintConnector } from "./BlueprintConnector";
import { ModuleInfoPanel } from "./DiagramAnnotations";
import { bedsideModules } from "./assistiveDeviceData";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function connectorColor(tone: string) {
  if (tone === "critical") return "#c94b4b";
  if (tone === "warning") return "#d6a441";
  if (tone === "sync") return "#2f8f86";
  return "#4ea69d";
}

export function BedsideCallerDiagram({
  baseRiskScore,
  patientId
}: {
  baseRiskScore: number;
  patientId: string;
}) {
  const [activeModuleId, setActiveModuleId] = useState(bedsideModules[0].id);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | undefined>();
  const [helpSent, setHelpSent] = useState(false);
  const focusedModuleId = hoveredModuleId ?? activeModuleId;
  const visibleModule = useMemo(
    () =>
      bedsideModules.find((item) => item.id === focusedModuleId) ??
      bedsideModules[0],
    [focusedModuleId]
  );
  const riskScore = helpSent ? Math.min(100, baseRiskScore + 30) : baseRiskScore;
  const riskScoreDeltaCopy = helpSent
    ? baseRiskScore >= 70
      ? "+30 rule, capped at 100"
      : "+30"
    : "";
  const acknowledgementStatus = helpSent ? "pending" : "idle";
  const alertQueue = helpSent ? ["床邊呼叫器求助"] : [];

  function triggerBedsideHelp() {
    setHelpSent(true);
    setActiveModuleId("bedside-help");
  }

  return (
    <section className="assistive-section blueprint-section" aria-label="床邊呼叫器剖面圖">
      <header className="assistive-section-header blueprint-section-header">
        <div>
          <span>Device 02 / Hardware Cutaway</span>
          <h3>床邊呼叫器剖面圖</h3>
          <p>圓角方形床邊求助裝置採透明上蓋剖面，保留大型 SOS、LED 狀態環、語音模組、PCB、電池與備援通訊。</p>
        </div>
        <strong>8 個硬體模組</strong>
      </header>

      <div className="blueprint-workspace">
        <div className="blueprint-diagram-surface bedside-cutaway-surface">
          <svg className="blueprint-connector-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {bedsideModules.map((item, index) => (
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
                laneOffset={(index % 2) * 1.4}
              />
            ))}
          </svg>

          <div className="bedside-cutaway-device">
            <div className="bedside-cutaway-shell">
              <span className="bedside-transparent-cover" />
              <span className="bedside-microphone-part">
                <i />
                <i />
                <i />
                <b>03</b>
              </span>
              <span className="bedside-speaker-part">
                <i />
                <i />
                <i />
                <b>04</b>
              </span>
              <span className="bedside-side-port" />
              <button
                type="button"
                className={classNames("bedside-sos-button", helpSent && "is-triggered")}
                onClick={triggerBedsideHelp}
                aria-label="送出床邊呼叫器求助"
              >
                <span className="bedside-led-ring">02</span>
                <strong>SOS</strong>
                <small>01</small>
              </button>
              <div className="bedside-internal-stack">
                <span className="bedside-pcb-part">
                  <b>05 MCU</b>
                  <i className="bedside-network-part">06</i>
                  <i className="bedside-buffer-part">07</i>
                </span>
                <span className="bedside-battery-part">08</span>
              </div>
            </div>
          </div>

          {bedsideModules.map((item) => (
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

          {bedsideModules.map((item) => (
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
          <article className={classNames("bedside-event-card", helpSent && "is-active")} aria-live="polite">
            <header>
              <span>Bedside Help Event</span>
              <b>{helpSent ? "送出求助" : "待命"}</b>
            </header>
            {helpSent ? (
              <p className="bedside-event-message">
                <BellRing size={15} />
                床邊呼叫器已送出求助，等待守望隊確認
              </p>
            ) : null}
            <dl>
              <div>
                <dt>helpEvent.active</dt>
                <dd>{String(helpSent)}</dd>
              </div>
              <div>
                <dt>helpEvent.source</dt>
                <dd>{helpSent ? "bedside_button" : "none"}</dd>
              </div>
              <div>
                <dt>riskScore</dt>
                <dd>{riskScore} {riskScoreDeltaCopy ? `(${riskScoreDeltaCopy})` : ""}</dd>
              </div>
              <div>
                <dt>alertQueue</dt>
                <dd>{alertQueue.length ? alertQueue.join("、") : "無新增求助"}</dd>
              </div>
              <div>
                <dt>acknowledgementStatus</dt>
                <dd>{acknowledgementStatus}</dd>
              </div>
              <div>
                <dt>patientId</dt>
                <dd>{patientId}</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>
    </section>
  );
}
