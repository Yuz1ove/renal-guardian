import { AlertTriangle, CheckCircle2, Clock4, Send, ShieldCheck } from "lucide-react";
import {
  acknowledgementLabels,
  riskLevelLabels,
  riskLevelZhLabels,
  type CaseStep
} from "./caseScenario";
import { CaseTimeline } from "./CaseTimeline";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function getCountdownLabel(step: CaseStep, progress: number) {
  if (step.patientState.responseState !== "pending") return null;
  const secondsLeft = Math.max(0, Math.ceil(30 * (1 - progress)));
  return `等待患者回應 ${secondsLeft}s`;
}

export function CareDashboardPanel({
  step,
  progress
}: {
  step: CaseStep;
  progress: number;
}) {
  const countdownLabel = getCountdownLabel(step, progress);
  const ackLabel = acknowledgementLabels[step.wearable.acknowledgementStatus] ?? step.wearable.acknowledgementStatus;

  return (
    <section className={classNames("care-dashboard-panel", `risk-${step.risk.level}`)} aria-label="Care Dashboard Panel">
      <div className="care-dashboard-grid">
        <article className="care-alert-card">
          <header>
            {step.careFlow.eventStatus === "resolved" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div>
              <span>{step.careFlow.eventStatus === "resolved" ? "Resolved Event" : "Care Alert"}</span>
              <strong>{step.alertTitle}</strong>
            </div>
            <b>{riskLevelLabels[step.risk.level]}</b>
          </header>
          <p>{step.alertBody}</p>
          <ul>
            {step.risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </article>

        <article className="care-action-card">
          <header>
            <Send size={18} />
            <div>
              <span>Recommended Action</span>
              <strong>{riskLevelZhLabels[step.risk.level]}</strong>
            </div>
          </header>
          <p>{step.risk.recommendedAction}</p>
          {countdownLabel ? (
            <div className="countdown-block">
              <div>
                <Clock4 size={16} />
                <span>{countdownLabel}</span>
              </div>
              <i aria-hidden="true">
                <b style={{ width: `${Math.round(progress * 100)}%` }} />
              </i>
            </div>
          ) : (
            <div className="ack-status-block">
              <ShieldCheck size={16} />
              <span>{ackLabel}</span>
            </div>
          )}
        </article>

        <CaseTimeline step={step} />
      </div>
    </section>
  );
}
