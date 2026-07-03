import { useMemo, useState } from "react";
import { BellRing, CheckCircle2, HeartPulse, MapPinned, MessageSquareText, ShieldAlert } from "lucide-react";
import { DiagramAnnotations, ModuleInfoPanel } from "./DiagramAnnotations";
import { dashboardModules } from "./assistiveDeviceData";

export function CareTeamDashboardDiagram() {
  const [activeModuleId, setActiveModuleId] = useState(dashboardModules[0].id);
  const [hoveredModuleId, setHoveredModuleId] = useState<string | undefined>();
  const visibleModule = useMemo(
    () =>
      dashboardModules.find((item) => item.id === (hoveredModuleId ?? activeModuleId)) ??
      dashboardModules[0],
    [activeModuleId, hoveredModuleId]
  );

  return (
    <section className="assistive-section" aria-label="守望隊居服員後台介面圖">
      <header className="assistive-section-header">
        <div>
          <span>Care Console</span>
          <h3>守望隊／居服員後台介面圖</h3>
          <p>將手環與床邊呼叫器資料轉成可處置的警報佇列、風險卡與低資料量安全確認流程。</p>
        </div>
        <strong>6 個標註區域</strong>
      </header>

      <div className="diagram-layout">
        <div className="annotated-diagram dashboard-diagram">
          <div className="care-dashboard-mock" aria-hidden="true">
            <header>
              <strong>腎安守望隊工作台</strong>
              <span>live sync · 14:38</span>
            </header>

            <section className="mock-patient-list">
              <b>使用者即時狀態</b>
              {[
                ["A102", "Critical", "HR 118", "SpO2 92", "低活動", "定位 OK"],
                ["B077", "Medium", "HR 94", "SpO2 95", "待確認", "家中"],
                ["C018", "Low", "HR 82", "SpO2 97", "休息", "同步中"]
              ].map((row) => (
                <p key={row[0]}>
                  {row.map((cell) => (
                    <span key={cell}>{cell}</span>
                  ))}
                </p>
              ))}
            </section>

            <section className="mock-alert-queue">
              <b>警報佇列</b>
              <div><ShieldAlert size={15} />高風險 2</div>
              <div><BellRing size={15} />中風險 4</div>
              <div><MessageSquareText size={15} />待確認 3</div>
              <div><CheckCircle2 size={15} />已處理 12</div>
            </section>

            <section className="mock-risk-card">
              <b>個案風險評估</b>
              <strong>riskScore 95</strong>
              <span>critical · 實體按鍵求助</span>
              <ul>
                <li>血氧下降</li>
                <li>活動量下降</li>
                <li>長時間未回覆</li>
              </ul>
            </section>

            <section className="mock-confirm-flow">
              <b>低資料量安全確認</b>
              <p>守望隊：請問您現在還好嗎？</p>
              <p>患者按鍵：不舒服</p>
              <p>系統：風險分數 +20</p>
            </section>

            <section className="mock-location">
              <b>位置確認</b>
              <div className="mini-map">
                <MapPinned size={24} />
                <i />
              </div>
              <p>台中市北區 · accuracy 18m</p>
            </section>

            <section className="mock-care-steps">
              <b>處置流程</b>
              {["偵測異常", "發送確認", "患者回覆", "更新風險", "通知守望隊", "聯絡醫護"].map((step, index) => (
                <span key={step}>
                  <i>{index + 1}</i>
                  {step}
                </span>
              ))}
            </section>

            <HeartPulse className="dashboard-watermark" size={86} />
          </div>
          <DiagramAnnotations
            modules={dashboardModules}
            activeModuleId={activeModuleId}
            hoveredModuleId={hoveredModuleId}
            onHoverModule={setHoveredModuleId}
            onSelectModule={setActiveModuleId}
          />
        </div>

        <ModuleInfoPanel module={visibleModule} locked={!hoveredModuleId} />
      </div>
    </section>
  );
}
