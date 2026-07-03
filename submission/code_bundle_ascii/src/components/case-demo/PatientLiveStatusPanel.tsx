import { useEffect, useState } from "react";
import { Activity, Clock3, HeartPulse, Radio, ShieldAlert, Signal, UserRound, Watch } from "lucide-react";
import {
  acknowledgementLabels,
  dataQualityLabels,
  motionStateLabels,
  responseStateLabels,
  riskLevelLabels,
  riskLevelZhLabels,
  type CaseStep
} from "./caseScenario";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function useAnimatedNumber(target: number | null, durationMs = 520) {
  const [value, setValue] = useState(target ?? 0);

  useEffect(() => {
    if (target === null) {
      setValue(0);
      return undefined;
    }

    const startValue = value;
    const delta = target - startValue;
    const startedAt = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(startValue + delta * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function AnimatedNumber({
  value,
  suffix = "",
  precision = 0
}: {
  value: number | null;
  suffix?: string;
  precision?: number;
}) {
  const animated = useAnimatedNumber(value);

  if (value === null) return <span>--</span>;

  return (
    <span>
      {animated.toFixed(precision)}
      {suffix}
    </span>
  );
}

function VitalTile({
  label,
  value,
  suffix,
  icon: Icon,
  level,
  max = 100
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon: typeof HeartPulse;
  level?: CaseStep["risk"]["level"];
  max?: number;
}) {
  const width = value === null ? 0 : Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <article className={classNames("live-vital-tile", level && `risk-${level}`)}>
      <header>
        <Icon size={16} />
        <span>{label}</span>
      </header>
      <strong>
        <AnimatedNumber value={value} suffix={suffix} />
      </strong>
      <div className="case-meter" aria-hidden="true">
        <i style={{ width: `${width}%` }} />
      </div>
    </article>
  );
}

export function PatientLiveStatusPanel({ step }: { step: CaseStep }) {
  const signalQualityPercent = Math.round(step.wearable.signalQuality * 100);
  const ackLabel = acknowledgementLabels[step.wearable.acknowledgementStatus] ?? step.wearable.acknowledgementStatus;
  const motionLabel = motionStateLabels[step.wearable.motionState] ?? step.wearable.motionState;

  return (
    <section className={classNames("patient-live-panel", `risk-${step.risk.level}`)} aria-label="Patient Live Status">
      <header className="case-panel-heading">
        <div>
          <span>Patient Live Status</span>
          <h3>使用者即時狀態</h3>
        </div>
        <b>{riskLevelLabels[step.risk.level]} / {riskLevelZhLabels[step.risk.level]}</b>
      </header>

      <div className="patient-state-hero">
        <div className={classNames("patient-figure", `pose-${step.patientState.responseState}`)} aria-hidden="true">
          <UserRound size={42} />
          <span className="patient-pulse" />
        </div>
        <div>
          <span>目前位置</span>
          <strong>{step.patientState.locationState}</strong>
          <p>{step.patientState.posture}｜{responseStateLabels[step.patientState.responseState]}</p>
        </div>
      </div>

      <div className="live-vitals-grid">
        <VitalTile label="HR" value={step.wearable.hr} suffix=" bpm" icon={HeartPulse} level={step.risk.level} max={140} />
        <VitalTile label="SpO2" value={step.wearable.spo2} suffix="%" icon={ShieldAlert} level={step.risk.level} />
        <VitalTile label="Activity" value={step.wearable.activityIndex} icon={Activity} level={step.risk.level} max={60} />
        <VitalTile label="Drop" value={step.wearable.activityDropPercent} suffix="%" icon={Signal} level={step.risk.level} />
      </div>

      <div className="status-detail-grid">
        <article>
          <span>motionState</span>
          <strong>{motionLabel}</strong>
        </article>
        <article>
          <span>dataQuality</span>
          <strong>{dataQualityLabels[step.wearable.dataQuality]}</strong>
        </article>
        <article>
          <span>signalQuality</span>
          <strong>{signalQualityPercent}%</strong>
          <div className="case-meter compact" aria-hidden="true">
            <i style={{ width: `${signalQualityPercent}%` }} />
          </div>
        </article>
        <article>
          <span>helpEvent.active</span>
          <strong>{step.wearable.helpEventActive ? "true" : "false"}</strong>
        </article>
      </div>

      <footer className="wearable-status-strip">
        <div className={classNames("wearable-chip", step.wearable.helpEventActive && "is-alerting")}>
          <Watch size={16} />
          <span>{step.wearable.helpEventActive ? "求助鍵啟動" : "正常配戴"}</span>
        </div>
        <div className="wearable-chip">
          <Radio size={16} />
          <span>{ackLabel}</span>
        </div>
        <div className="wearable-chip">
          <Clock3 size={16} />
          <span>{step.wearable.lastSyncTime}</span>
        </div>
      </footer>
    </section>
  );
}
