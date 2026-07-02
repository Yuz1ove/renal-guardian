import { BellRing, HeartPulse, Info, MonitorSmartphone, Stethoscope, Watch } from "lucide-react";
import { useMemo } from "react";
import { formatTime } from "../../lib/eventLog";
import { useCareStore } from "../../store/careStore";
import { CaregiverDashboard } from "./CaregiverDashboard";
import { DemoControls } from "./DemoControls";
import { DeviceStatusPanel } from "./DeviceStatusPanel";
import { EventTimeline } from "./EventTimeline";
import { RiskBadge } from "./RiskBadge";
import { TechExplanationPanel } from "./TechExplanationPanel";

const postureLabel = {
  lying: "躺臥",
  sitting: "坐姿",
  standing: "站立",
  walking: "步行"
};

export function MonitoringPanel() {
  const activeView = useCareStore((state) => state.activeView);
  const setActiveView = useCareStore((state) => state.setActiveView);
  const activePatientId = useCareStore((state) => state.activePatientId);
  const patients = useCareStore((state) => state.patients);
  const wearable = useCareStore((state) => state.wearablePacket);
  const bedside = useCareStore((state) => state.bedsidePacket);
  const riskResults = useCareStore((state) => state.riskResults);
  const events = useCareStore((state) => state.events);
  const triggerBedsideCall = useCareStore((state) => state.triggerBedsideCall);

  const patient = useMemo(
    () => patients.find((item) => item.id === activePatientId) ?? patients[0],
    [activePatientId, patients]
  );
  const risk = riskResults[patient.id];
  const lastUpdated = formatTime(risk.updatedAt);

  return (
    <aside className="monitoring-panel" aria-label="即時監測與風險評估面板">
      <header className="panel-title">
        <div>
          <span>Renal Guardian</span>
          <h1>腎安｜返家恢復期風險監測</h1>
        </div>
        <RiskBadge level={risk.level} />
      </header>

      <p className="medical-note">
        本系統為照護輔助與風險提醒原型，非醫療診斷工具；實際數值與警示需由醫療專業人員設定與判讀。
      </p>

      <nav className="view-tabs" aria-label="展示區塊">
        <button className={activeView === "wearable" ? "is-active" : ""} onClick={() => setActiveView("wearable")}>
          <Watch size={16} />
          手環
        </button>
        <button className={activeView === "bedside" ? "is-active" : ""} onClick={() => setActiveView("bedside")}>
          <BellRing size={16} />
          呼叫器
        </button>
        <button className={activeView === "dashboard" ? "is-active" : ""} onClick={() => setActiveView("dashboard")}>
          <MonitorSmartphone size={16} />
          後台
        </button>
        <button className={activeView === "tech" ? "is-active" : ""} onClick={() => setActiveView("tech")}>
          <Info size={16} />
          技術
        </button>
      </nav>

      <DemoControls />

      <section className={`health-summary health-summary--${risk.level}`}>
        <div>
          <span>即時健康摘要</span>
          <strong>{risk.score}</strong>
        </div>
        <div>
          <RiskBadge level={risk.level} />
          <p>最後更新 {lastUpdated}</p>
          <p>{risk.reasons[0]}</p>
        </div>
      </section>

      {activeView === "wearable" ? (
        <section className="detail-panel">
          <h2>
            <Watch size={18} />
            A. 洗腎者佩戴裝置
          </h2>
          <div className="metric-grid">
            <div>
              <span>心率</span>
              <strong>{wearable.heartRate} bpm</strong>
            </div>
            <div>
              <span>活動指數</span>
              <strong>{wearable.activityIndex}</strong>
            </div>
            <div>
              <span>姿態推估</span>
              <strong>{postureLabel[wearable.posture]}</strong>
            </div>
            <div>
              <span>外接血壓計同步</span>
              <strong>{wearable.systolicBP ? `${wearable.systolicBP}/${wearable.diastolicBP}` : "未同步"}</strong>
            </div>
            <div>
              <span>SOS</span>
              <strong>{wearable.sosPressed ? "已觸發" : "待命"}</strong>
            </div>
            <div>
              <span>跌倒偵測</span>
              <strong>{wearable.fallDetected ? "已偵測" : "未偵測"}</strong>
            </div>
          </div>
          <p className="field-note">血壓欄位為外接血壓計同步或 demo 模擬資料，不作為醫療級診斷。</p>
        </section>
      ) : null}

      {activeView === "bedside" ? (
        <section className="detail-panel">
          <h2>
            <BellRing size={18} />
            B. 床邊呼叫器
          </h2>
          <div className="metric-grid">
            <div>
              <span>在線狀態</span>
              <strong>{bedside.deviceOnline ? "在線" : "離線"}</strong>
            </div>
            <div>
              <span>最後呼叫</span>
              <strong>{bedside.buttonPressed ? formatTime(bedside.timestamp) : "尚無"}</strong>
            </div>
            <div>
              <span>按鈕狀態</span>
              <strong>{bedside.longPressEmergency ? "緊急長按" : bedside.buttonPressed ? "一般協助" : "待命"}</strong>
            </div>
            <div>
              <span>無反應分鐘</span>
              <strong>{bedside.noResponseMinutes} 分</strong>
            </div>
          </div>
          <div className="inline-actions">
            <button onClick={() => triggerBedsideCall(false)}>
              <BellRing size={16} />
              單擊一般協助
            </button>
            <button className="danger" onClick={() => triggerBedsideCall(true)}>
              <BellRing size={16} />
              長按 3 秒緊急求助
            </button>
          </div>
        </section>
      ) : null}

      {activeView === "dashboard" ? <CaregiverDashboard /> : null}
      {activeView === "tech" ? <TechExplanationPanel /> : null}

      <section className="detail-panel compact">
        <h2>
          <Stethoscope size={18} />
          裝置狀態
        </h2>
        <DeviceStatusPanel wearable={wearable} bedside={bedside} />
      </section>

      <section className="detail-panel compact">
        <h2>
          <HeartPulse size={18} />
          建議處置
        </h2>
        <ul className="action-list">
          {risk.recommendedActions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </section>

      <section className="detail-panel compact timeline-wrap">
        <h2>事件時間線</h2>
        <EventTimeline events={events} />
      </section>
    </aside>
  );
}
