import { AlertTriangle, BellRing, CheckCircle2, HeartPulse, Info, Watch } from "lucide-react";
import { useMemo } from "react";
import { bedsideHelpEvent, caregiverActions, scoreBreakdownFooter, wearablePacket } from "./demoFlowData";
import type { PatientWithRisk } from "./mockPatients";
import type { DemoMode } from "./scenePresets";
import { RiskQueue } from "./RiskQueue";

const levelClass = {
  stable: "stable",
  watch: "watch",
  warning: "warning",
  critical: "critical"
};

const levelCopy = {
  stable: "Stable",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical"
};

export function RiskDashboard({
  patients,
  activePatientId,
  mode,
  bedsideEventActive,
  assigned,
  toast,
  focusMessage,
  onSelectPatient,
  onWearablePacket,
  onBedsideEvent,
  onFocusA203
}: {
  patients: PatientWithRisk[];
  activePatientId: string;
  mode: DemoMode;
  bedsideEventActive: boolean;
  assigned: boolean;
  toast: string;
  focusMessage: string;
  onSelectPatient: (patientId: string) => void;
  onWearablePacket: () => void;
  onBedsideEvent: () => void;
  onFocusA203: () => void;
}) {
  const activePatient = useMemo(
    () => patients.find((patient) => patient.id === activePatientId) ?? patients[0],
    [activePatientId, patients]
  );
  const highlightVitals = mode === "wearable";

  function markA203() {
    onSelectPatient("a203");
    onFocusA203();
  }

  return (
    <aside className="dashboard-panel" aria-label="照護端風險面板">
      <header className="dashboard-title">
        <span>AI Care Coordination Demo</span>
        <h2>照護端風險面板</h2>
        <p>本系統為風險提醒與照護協作，不作為醫療診斷。</p>
      </header>

      <section className={`score-card score-card-${levelClass[activePatient.risk.level]}`}>
        <div>
          <span>原型模擬分數</span>
          <strong>{activePatient.risk.score}</strong>
        </div>
        <div className="score-detail">
          <b>{levelCopy[activePatient.risk.level]}｜{activePatient.risk.level === "critical" ? "立即關注" : activePatient.statusAction}</b>
          <p>{activePatient.risk.recommendedAction}</p>
          <div className="risk-bar" aria-label={`風險分數 ${activePatient.risk.score}`}>
            <i style={{ width: `${activePatient.risk.score}%` }} />
          </div>
          <small>0-39 Stable / 40-69 Watch / 70-89 Warning / 90-100 Critical</small>
        </div>
      </section>

      <section className="metric-cards" aria-label="即時資料">
        <article className={highlightVitals ? "is-highlighted" : ""}>
          <HeartPulse size={17} />
          <span>HR</span>
          <strong>{activePatient.signals.heartRate} bpm</strong>
        </article>
        <article className={highlightVitals ? "is-highlighted" : ""}>
          <Watch size={17} />
          <span>SpO2</span>
          <strong>{activePatient.signals.spo2}%</strong>
        </article>
        <article className={highlightVitals ? "is-highlighted" : ""}>
          <AlertTriangle size={17} />
          <span>活動量下降</span>
          <strong>{activePatient.signals.activityDropPercent}%</strong>
        </article>
        {highlightVitals ? (
          <>
            <article className="is-highlighted compact-metric">
              <span>封包大小</span>
              <strong>{wearablePacket.payloadSize}</strong>
            </article>
            <article className="is-highlighted compact-metric">
              <span>訊號狀態</span>
              <strong>{wearablePacket.signal}</strong>
            </article>
            <article className="is-highlighted compact-metric">
              <span>最後回傳</span>
              <strong>{wearablePacket.lastSeen}</strong>
            </article>
          </>
        ) : null}
      </section>

      <section className="risk-reasons">
        <header>
          <Info size={16} />
          <strong>風險原因</strong>
        </header>
        <ul>
          {activePatient.risk.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
          {bedsideEventActive && !activePatient.risk.reasons.some((reason) => reason.includes("床邊求助")) ? (
            <li>床邊求助事件 +40</li>
          ) : null}
          <li>{scoreBreakdownFooter}</li>
        </ul>
      </section>

      {mode === "bedside" || bedsideEventActive ? (
        <section className="call-toast">
          <BellRing size={18} />
          <div>
            <strong>床邊求助事件</strong>
            <p>{bedsideHelpEvent.userAction}：{bedsideHelpEvent.symptom}，priority {bedsideHelpEvent.priority}。</p>
          </div>
        </section>
      ) : null}

      {mode === "team" ? (
        <section className="action-plan" aria-label="照護建議動作">
          <strong>建議動作</strong>
          <ul>
            {caregiverActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          {assigned ? <p>A-203 已分派照護人員，等待回報處置結果。</p> : null}
        </section>
      ) : null}

      <div className="dashboard-actions">
        <button type="button" onClick={onWearablePacket}>
          <Watch size={16} />
          手環資料
        </button>
        <button type="button" onClick={onBedsideEvent}>
          <BellRing size={16} />
          床邊求助
        </button>
        <button type="button" className={assigned ? "is-done" : ""} onClick={markA203}>
          <CheckCircle2 size={16} />
          {assigned ? "已分派" : "立即關注"}
        </button>
      </div>

      <RiskQueue patients={patients} activePatientId={activePatientId} assigned={assigned} onSelectPatient={onSelectPatient} onFocusA203={onFocusA203} />

      {toast ? <p className="toast-line" role="status">{toast}</p> : null}
      {focusMessage ? <p className="feedback-line">{focusMessage}</p> : null}
    </aside>
  );
}
