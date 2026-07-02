import { useMemo, useState } from "react";
import { modeNarratives } from "./demoFlowData";
import { DeviceModuleCard } from "./DeviceModuleCard";
import { DemoModeTabs } from "./DemoModeTabs";
import { patientsWithRisk } from "./mockPatients";
import { RiskDashboard } from "./RiskDashboard";
import { SceneCanvas } from "./SceneCanvas";
import { type DemoMode, scenePresets } from "./scenePresets";
import "../../styles/care-demo.css";

export function CareDemoPage() {
  const patients = useMemo(() => patientsWithRisk(), []);
  const [mode, setMode] = useState<DemoMode>("overview");
  const [activePatientId, setActivePatientId] = useState("a203");
  const [bedsideEventActive, setBedsideEventActive] = useState(true);
  const [assigned, setAssigned] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [toast, setToast] = useState("");

  function changeMode(nextMode: DemoMode) {
    setMode(nextMode);
    if (nextMode === "bedside") {
      setBedsideEventActive(true);
      setFeedback("床邊求助事件已加入風險原因：床邊求助事件 +40");
    } else if (nextMode === "team") {
      setActivePatientId("a203");
      setFeedback(assigned ? "A-203 已分派照護人員，照護端與家屬已收到通知。" : "照護端已高亮 A-203，等待立即關注處置。");
    } else if (nextMode === "wearable") {
      setFeedback("A-203 手環資料以 0.8 KB 低資料量封包送往 API。");
    } else {
      setFeedback(modeNarratives.overview.body);
    }
  }

  function receiveWearablePacket() {
    setMode("wearable");
    setActivePatientId("a203");
    setFeedback("已接收 A-203 手環低資料量封包，HR / SpO2 / 活動量同步更新。");
    setToast("已接收 A-203 手環封包");
  }

  function triggerBedsideEvent() {
    setBedsideEventActive(true);
    setMode("bedside");
    setActivePatientId("a203");
    setFeedback("床邊求助事件已建立，A-203 置頂進入照護端風險隊列。");
    setToast("已建立床邊求助事件");
  }

  function focusA203() {
    setAssigned(true);
    setMode("team");
    setActivePatientId("a203");
    setFeedback("A-203 狀態已改為「已分派照護人員」，建議同步通知家屬與醫療團隊。");
    setToast("已通知照護端與家屬");
  }

  return (
    <main className="care-demo-page">
      <section className="demo-shell" aria-label="腎安洗腎返家恢復期照護協作系統">
        <section className="demo-stage" aria-label="三端模組 3D 展示">
          <header className="hero-copy">
            <span>AI Care Coordination Demo</span>
            <h1>腎安</h1>
            <p className="hero-subtitle">洗腎返家恢復期照護協作系統</p>
            <p className="hero-description">
              補上透析室與家庭照護之間的風險空白，協助患者、家屬與照護團隊在異常發生前採取行動。
            </p>
          </header>

          <SceneCanvas
            mode={mode}
            patients={patients}
            activePatientId={activePatientId}
            bedsideEventActive={bedsideEventActive}
            acknowledged={assigned}
            assigned={assigned}
            onModeChange={changeMode}
          />

          <div className="stage-bottom">
            <DemoModeTabs mode={mode} onChange={changeMode} />
            <DeviceModuleCard mode={mode} />
          </div>
        </section>

        <RiskDashboard
          patients={patients}
          activePatientId={activePatientId}
          mode={mode}
          bedsideEventActive={bedsideEventActive}
          assigned={assigned}
          toast={toast}
          focusMessage={feedback || scenePresets[mode].description}
          onSelectPatient={setActivePatientId}
          onWearablePacket={receiveWearablePacket}
          onBedsideEvent={triggerBedsideEvent}
          onFocusA203={focusA203}
        />
      </section>
    </main>
  );
}
