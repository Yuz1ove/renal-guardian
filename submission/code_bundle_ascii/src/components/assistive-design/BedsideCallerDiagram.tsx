import { useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { BlueprintConnector } from "./BlueprintConnector";
import { ModuleInfoPanel } from "./DiagramAnnotations";
import { bedsideModules, type AnnotationPosition } from "./assistiveDeviceData";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function connectorColor(tone: string) {
  if (tone === "critical") return "#c94b4b";
  if (tone === "warning") return "#d6a441";
  if (tone === "sync") return "#2f8f86";
  return "#4ea69d";
}

const bedsideSceneLayout: Record<string, AnnotationPosition> = {
  "bedside-help": { markerX: 50, markerY: 47, cardX: 3, cardY: 2, lineEndX: 28, lineEndY: 12 },
  "status-light": { markerX: 58, markerY: 41, cardX: 74, cardY: 2, lineEndX: 72, lineEndY: 12 },
  microphone: { markerX: 42, markerY: 25, cardX: 3, cardY: 28, lineEndX: 28, lineEndY: 38 },
  speaker: { markerX: 58, markerY: 25, cardX: 74, cardY: 28, lineEndX: 72, lineEndY: 38 },
  "bedside-pcb": { markerX: 42, markerY: 66, cardX: 3, cardY: 54, lineEndX: 28, lineEndY: 64 },
  "bedside-network": { markerX: 60, markerY: 66, cardX: 74, cardY: 54, lineEndX: 72, lineEndY: 64 },
  "bedside-buffer": { markerX: 42, markerY: 79, cardX: 3, cardY: 79, lineEndX: 28, lineEndY: 89 },
  "bedside-battery": { markerX: 58, markerY: 79, cardX: 74, cardY: 79, lineEndX: 72, lineEndY: 89 }
};

function scenePositionFor(moduleId: string, fallback: AnnotationPosition) {
  return bedsideSceneLayout[moduleId] ?? fallback;
}

function markerStyle(position: AnnotationPosition) {
  return {
    left: `calc(${position.markerX}% - 16px)`,
    top: `calc(${position.markerY}% - 13px)`
  };
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
  const sceneModules = useMemo(
    () =>
      bedsideModules.map((item) => ({
        ...item,
        scenePosition: scenePositionFor(item.id, item.position)
      })),
    []
  );

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
          <div className="blueprintScene">
            <svg className="blueprint-connector-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {sceneModules.map((item, index) => (
                <BlueprintConnector
                  key={item.id}
                  sourceAnchor={{ x: item.scenePosition.markerX, y: item.scenePosition.markerY }}
                  targetAnchor={{ x: item.scenePosition.lineEndX, y: item.scenePosition.lineEndY }}
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

            <div className="bedside-cutaway-device deviceBody">
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

            {sceneModules.map((item) => (
              <button
                key={`${item.id}-marker`}
                type="button"
                className={classNames(
                  "blueprint-marker",
                  `tone-${item.tone}`,
                  item.id === focusedModuleId && "is-active",
                  item.id !== focusedModuleId && "is-muted"
                )}
                style={markerStyle(item.scenePosition)}
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

            {sceneModules.map((item) => (
              <button
                key={`${item.id}-label`}
                type="button"
                className={classNames(
                  "blueprint-label",
                  item.scenePosition.cardX < 50 ? "is-left" : "is-right",
                  `tone-${item.tone}`,
                  item.id === focusedModuleId && "is-active",
                  item.id !== focusedModuleId && "is-muted"
                )}
                style={{ left: `${item.scenePosition.cardX}%`, top: `${item.scenePosition.cardY}%` }}
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
