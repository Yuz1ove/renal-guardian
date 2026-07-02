import { Activity, AlertTriangle, BellRing, Check, CheckCheck, HeartPulse, Info, Rotate3D } from "lucide-react";
import { useMemo, useState } from "react";
import { baseDemoPatients, calculateRiskScore, createEvent, levelMeta, scorePatients, sortByRisk } from "../../data/renalDemoData";
import { ModelScene } from "./ModelScene";

function applyRisk(patient) {
  return { ...patient, ...calculateRiskScore(patient) };
}

function resetPatientsForStable() {
  return scorePatients(
    baseDemoPatients.map((patient) => ({
      ...patient,
      heartRate: patient.id === "p1" ? 76 : patient.heartRate,
      spo2: Math.max(95, patient.spo2),
      activityDelta: patient.id === "p1" ? 0 : Math.min(0, patient.activityDelta),
      signal: Math.max(70, patient.signal),
      battery: Math.max(70, patient.battery),
      callPressed: false,
      symptoms: patient.id === "p1" ? [] : patient.symptoms.filter((symptom) => symptom === "疲倦"),
      lastDialysisHours: patient.id === "p1" ? 8 : patient.lastDialysisHours
    }))
  );
}

const initialPatients = scorePatients(baseDemoPatients);

export function RenalGuardianInteractivePanel() {
  const [patients, setPatients] = useState(initialPatients);
  const [selectedPatientId, setSelectedPatientId] = useState("p1");
  const [activeDevice, setActiveDevice] = useState("bracelet");
  const [activeAlertId, setActiveAlertId] = useState("p1");
  const [eventStatus, setEventStatus] = useState("待確認");
  const [isStreaming, setIsStreaming] = useState(true);
  const [events, setEvents] = useState([
    createEvent("A-203 侯冠宇｜心率低於 55 bpm +15，血氧低於 94% +15，透析後活動量下降 +20", "待確認")
  ]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];
  const sortedPatients = useMemo(() => sortByRisk(patients), [patients]);
  const deviceCopy = {
    bracelet: "手環端正在回傳低資料量封包，包含心率、血氧、活動變化、電量與訊號品質。",
    bed: "床邊呼叫器提供一鍵求助與弱訊號備援，適合夜間或患者虛弱時使用。",
    dashboard: "照護端看板依風險分數排序，讓居服員優先確認高風險個案。"
  };

  function updateSelected(mutator) {
    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== selectedPatientId) return patient;
        return applyRisk(mutator(patient));
      })
    );
  }

  function simulateStable() {
    setPatients(resetPatientsForStable());
    setActiveAlertId(null);
    setEventStatus("無新事件");
    setIsStreaming(false);
    setEvents([createEvent("目前無新事件，維持返家恢復期觀察。", "無新事件")]);
  }

  function simulateWeak() {
    updateSelected((patient) => ({
      ...patient,
      heartRate: 58,
      spo2: 95,
      activityDelta: -6,
      signal: Math.max(54, patient.signal),
      battery: Math.max(62, patient.battery),
      callPressed: false,
      lastDialysisHours: 4,
      symptoms: ["疲倦"]
    }));
    setActiveAlertId(selectedPatientId);
    setEventStatus("待確認");
    setIsStreaming(true);
    setEvents((current) => [createEvent(`${selectedPatient.room} ${selectedPatient.name}｜透析後疲弱，活動量下降 +20`, "待確認"), ...current]);
  }

  function simulateEmergency() {
    updateSelected((patient) => ({
      ...patient,
      heartRate: 52,
      spo2: 93,
      activityDelta: -8,
      signal: 62,
      battery: 81,
      callPressed: true,
      lastDialysisHours: 3,
      symptoms: ["頭暈", "冒冷汗", "下床困難"]
    }));
    setActiveDevice("bed");
    setActiveAlertId(selectedPatientId);
    setEventStatus("待確認");
    setIsStreaming(true);
    setEvents((current) => [
      createEvent(`${selectedPatient.room} ${selectedPatient.name}｜心率低於 55 bpm +15，透析後活動量下降 +20，床邊求助 +40`, "待確認"),
      ...current
    ]);
  }

  function triggerBedCall() {
    updateSelected((patient) => ({
      ...patient,
      callPressed: true,
      signal: Math.max(35, patient.signal),
      symptoms: patient.symptoms.includes("頭暈") ? patient.symptoms : [...patient.symptoms, "頭暈"]
    }));
    setActiveDevice("bed");
    setActiveAlertId(selectedPatientId);
    setEventStatus("待確認");
    setIsStreaming(true);
    setEvents((current) => [createEvent(`${selectedPatient.room} ${selectedPatient.name}｜床邊呼叫器已觸發，風險分數至少 +40`, "待確認"), ...current]);
  }

  function markAcknowledged() {
    setEventStatus("已確認");
    setEvents((current) => [createEvent(`${selectedPatient.room} ${selectedPatient.name}｜居服員已確認，處理中。`, "已確認"), ...current]);
  }

  function markResolved() {
    updateSelected((patient) => ({
      ...patient,
      heartRate: 64,
      spo2: 95,
      activityDelta: -5,
      signal: Math.max(62, patient.signal),
      callPressed: false,
      symptoms: ["疲倦"],
      lastDialysisHours: Math.min(patient.lastDialysisHours, 5)
    }));
    setEventStatus("已完成");
    setActiveAlertId(null);
    setIsStreaming(false);
    setEvents((current) => [createEvent(`${selectedPatient.room} ${selectedPatient.name}｜事件已完成，個案改為持續觀察。`, "已完成"), ...current]);
  }

  function selectPatient(patient) {
    setSelectedPatientId(patient.id);
    setActiveDevice("dashboard");
  }

  return (
    <main className="renal-panel">
      <section className="renal-scene-panel" aria-label="腎安三端式 3D 展示">
        <div className="renal-scene-heading">
          <div>
            <span>腎安展示原型</span>
            <h1>洗腎返家恢復期照護協作系統</h1>
          </div>
          <div className="orbit-note">
            <Rotate3D size={16} />
            可拖曳旋轉 / 滾輪縮放
          </div>
        </div>
        <div className="renal-canvas-wrap">
          <ModelScene
            patient={selectedPatient}
            patients={patients}
            activeAlertId={activeAlertId}
            eventStatus={eventStatus}
            isStreaming={isStreaming}
            onSelectDevice={setActiveDevice}
            onEmergencyCall={triggerBedCall}
            onSelectPatient={selectPatient}
          />
        </div>
        <div className="renal-flow-cards">
          <button onClick={() => setActiveDevice("bracelet")} className={activeDevice === "bracelet" ? "active" : ""}>
            <span>1</span>
            手環監測
          </button>
          <button onClick={triggerBedCall} className={activeDevice === "bed" ? "active" : ""}>
            <span>2</span>
            床邊呼叫
          </button>
          <button onClick={() => setActiveDevice("dashboard")} className={activeDevice === "dashboard" ? "active" : ""}>
            <span>3</span>
            照護團隊處理
          </button>
        </div>
      </section>

      <aside className="renal-control-panel" aria-label="即時控制與風險列表">
        <header className="renal-title">
          <div>
            <span>Renal Guardian</span>
            <h2>腎安｜返家恢復期風險監測</h2>
          </div>
          <strong className={`renal-badge ${selectedPatient.level}`}>{levelMeta[selectedPatient.level].label}</strong>
        </header>
        <p className="renal-disclaimer">本系統為照護輔助與風險提醒原型，非醫療診斷工具；實際數值與警示需由醫療專業人員設定與判讀。</p>

        <div className="renal-demo-buttons">
          <button onClick={simulateStable}>
            <Activity size={16} />
            模擬穩定狀態
          </button>
          <button onClick={simulateWeak}>
            <HeartPulse size={16} />
            模擬透析後疲弱
          </button>
          <button className="danger" onClick={simulateEmergency}>
            <AlertTriangle size={16} />
            模擬緊急事件
          </button>
        </div>

        <section className={`renal-summary ${selectedPatient.level}`}>
          <div>
            <span>即時健康摘要</span>
            <strong>{selectedPatient.score}</strong>
          </div>
          <div>
            <b>{selectedPatient.room} {selectedPatient.name}</b>
            <p>{selectedPatient.reason}</p>
            <p>建議處置：{selectedPatient.action}</p>
          </div>
        </section>

        <section className="renal-device-copy">
          <Info size={16} />
          <p>{deviceCopy[activeDevice]}</p>
        </section>

        <section className="renal-metrics">
          <div>
            <span>HR</span>
            <strong>{selectedPatient.heartRate}</strong>
          </div>
          <div>
            <span>SpO2</span>
            <strong>{selectedPatient.spo2}%</strong>
          </div>
          <div>
            <span>活動變化</span>
            <strong>{selectedPatient.activityDelta}</strong>
          </div>
          <div>
            <span>SIG / BAT</span>
            <strong>{selectedPatient.signal}% / {selectedPatient.battery}%</strong>
          </div>
        </section>

        <section className="renal-list">
          <div className="renal-section-title">
            <strong>照護端風險列表</strong>
            <span>{eventStatus}</span>
          </div>
          {sortedPatients.map((patient) => (
            <button key={patient.id} className={patient.id === selectedPatientId ? "selected" : ""} onClick={() => selectPatient(patient)}>
              <span>{patient.name}</span>
              <span>{patient.room}</span>
              <strong>{patient.score}</strong>
              <em className={patient.level}>{levelMeta[patient.level].label}</em>
            </button>
          ))}
        </section>

        <div className="renal-status-actions">
          <button onClick={triggerBedCall}>
            <BellRing size={16} />
            觸發床邊呼叫
          </button>
          <button onClick={markAcknowledged} disabled={eventStatus === "已確認" || eventStatus === "已完成" || eventStatus === "無新事件"}>
            <Check size={16} />
            標記已確認
          </button>
          <button onClick={markResolved} disabled={eventStatus === "已完成" || eventStatus === "無新事件"}>
            <CheckCheck size={16} />
            標記已完成
          </button>
        </div>

        <section className="renal-events">
          <div className="renal-section-title">
            <strong>事件時間線</strong>
            <span>{events.length} 筆</span>
          </div>
          {events.map((event) => (
            <article key={event.id}>
              <time>{event.time}</time>
              <p>{event.message}</p>
              <span>{event.status}</span>
            </article>
          ))}
        </section>
      </aside>
    </main>
  );
}
