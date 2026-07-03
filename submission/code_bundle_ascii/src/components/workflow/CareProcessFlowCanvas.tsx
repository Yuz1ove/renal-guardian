import {
  Activity,
  BellRing,
  ClipboardList,
  Home,
  RefreshCcw,
  ServerCog,
  Signal,
  UserRoundCheck,
  Watch
} from "lucide-react";
import type { CareCase, WorkflowStage, WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { riskLevelLabel, riskLevelZhLabel } from "../../domain/riskScoring";
import type { DemoMode } from "../care-demo/scenePresets";
import { FlowConnector } from "./FlowConnector";
import { ProcessLane } from "./ProcessLane";
import { ProcessNode } from "./ProcessNode";
import { SystemLayerLegend } from "./SystemLayerLegend";
import { WristbandCapabilityCard } from "./WristbandCapabilityCard";

interface CareProcessFlowCanvasProps {
  workflow: WorkflowViewModel;
  selectedStage?: WorkflowStage;
  onStageSelect?: (stage: WorkflowStage) => void;
  queueWorkflows?: WorkflowViewModel[];
  focusMode?: DemoMode;
  onFocusModeChange?: (mode: DemoMode) => void;
}

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

function formatNumber(value: number | null, suffix = "") {
  return typeof value === "number" && Number.isFinite(value) ? `${value}${suffix}` : "資料需確認";
}

function signalLabel(signalStatus: CareCase["telemetry"]["signalStatus"]) {
  if (signalStatus === "weak") return "弱訊號";
  if (signalStatus === "offline") return "離線";
  return "正常";
}

function sourceLabel(source: NonNullable<CareCase["helpEvent"]>["source"]) {
  if (source === "wristband") return "手環 SOS";
  if (source === "bedside") return "床邊";
  return "居家 gateway";
}

function focusStages(mode: DemoMode | undefined): WorkflowStage[] {
  if (mode === "wearable") return ["wristband", "telemetry", "packet"];
  if (mode === "bedside") return ["helpEvent", "packet", "riskEngine", "triage"];
  if (mode === "team") return ["queue", "assignment", "feedback"];
  return [];
}

export function CareProcessFlowCanvas({
  workflow,
  selectedStage,
  onStageSelect,
  queueWorkflows = [workflow],
  focusMode,
  onFocusModeChange
}: CareProcessFlowCanvasProps) {
  const careCase = workflow.case;
  const { telemetry, helpEvent, recoveryContext } = careCase;
  const hasHelpEvent = Boolean(helpEvent?.active);
  const focusedStages = focusStages(focusMode);
  const telemetryPacket = `${Math.max(0, telemetry.payloadSizeKb).toFixed(1)} KB`;
  const queuePreview = queueWorkflows.map((item) => `${item.case.patientId} ${riskLevelLabel[item.risk.level]}`);
  const reasonPreview = workflow.risk.reasons
    .filter((reason) => reason.points > 0)
    .slice(0, 3)
    .map((reason) => `${reason.label} +${reason.points}`)
    .join(" / ");

  function isActive(stage: WorkflowStage) {
    return workflow.activeStages.includes(stage);
  }

  function isSelected(stage: WorkflowStage) {
    return selectedStage === stage || (!selectedStage && focusedStages.includes(stage));
  }

  function select(stage: WorkflowStage, mode?: DemoMode) {
    onStageSelect?.(stage);
    if (mode) onFocusModeChange?.(mode);
  }

  return (
    <section
      className={classNames("care-process-canvas", `risk-${workflow.risk.level}`, focusMode && `mode-${focusMode}`)}
      aria-label="從監測到處置流程架構"
    >
      <header className="process-canvas-header">
        <div>
          <span>Process Flow Canvas</span>
          <h2>資料來源到照護閉環</h2>
        </div>
        <p>
          telemetry / event packet 進入 API ingest，由 rule-based risk engine 產生原因、分數與照護分級，再同步照護隊列、分派與回覆狀態。
        </p>
      </header>

      <div className="process-flow-grid">
        <ProcessLane eyebrow="Patient Signals" title="資料來源">
          <ProcessNode
            stage="patient"
            eyebrow="Patient"
            title="患者返家恢復期"
            description={`${careCase.patientId}｜${careCase.displayName}｜透析後 ${recoveryContext?.afterDialysisHours ?? "-"} 小時｜${recoveryContext?.homeRecovery ? "返家恢復期" : "照護觀察"}`}
            icon={Home}
            kind="source"
            active={isActive("patient")}
            selected={isSelected("patient")}
            riskLevel={workflow.risk.level}
            chips={["返家恢復期", "非診斷用途"]}
            onClick={() => select("patient", "overview")}
          />
          <FlowConnector active={isActive("patient") && isActive("wristband")} />
          <WristbandCapabilityCard
            workflow={workflow}
            active={isActive("wristband")}
            selected={isSelected("wristband")}
            onSelect={(stage) => select(stage, "wearable")}
          />
          <FlowConnector active={isActive("wristband") && isActive("telemetry")} />
          <ProcessNode
            stage="telemetry"
            eyebrow="Telemetry"
            title="手環低資料量監測"
            description={`HR ${formatNumber(telemetry.hr, " bpm")}｜SpO2 ${formatNumber(telemetry.spo2, "%")}｜活動量下降 ${formatNumber(telemetry.activityDropPercent, "%")}`}
            icon={Watch}
            kind="source"
            active={isActive("telemetry")}
            selected={isSelected("telemetry")}
            riskLevel={workflow.risk.level}
            chips={[telemetryPacket, signalLabel(telemetry.signalStatus), telemetry.lastSyncTime || "資料需確認"]}
            onClick={() => select("telemetry", "wearable")}
          />
          <FlowConnector active={isActive("telemetry") && (isActive("helpEvent") || isActive("packet"))} />
          <ProcessNode
            stage="helpEvent"
            eyebrow="Event source"
            title="床邊 / 居家 / 手環求助事件"
            description={
              hasHelpEvent && helpEvent
                ? `${sourceLabel(helpEvent.source)}｜${helpEvent.symptoms.join("、")}｜${helpEvent.createdAt}`
                : "目前無主動求助事件，節點保持待命。"
            }
            icon={BellRing}
            kind="event"
            active={isActive("helpEvent")}
            selected={isSelected("helpEvent")}
            muted={!hasHelpEvent}
            riskLevel={workflow.risk.level}
            chips={hasHelpEvent && helpEvent ? ["異常事件提示", `priority ${helpEvent.priority}`] : ["event standby"]}
            onClick={() => select("helpEvent", "bedside")}
          />
        </ProcessLane>

        <ProcessLane eyebrow="Decision Layer" title="風險引擎" decision>
          <ProcessNode
            stage="packet"
            eyebrow="Telemetry / event packet"
            title="封包進入 API"
            description={hasHelpEvent ? "telemetry packet + event packet 合併送入 API ingest。" : "telemetry packet 送入 API ingest。"}
            icon={Signal}
            kind="packet"
            active={isActive("packet")}
            selected={isSelected("packet")}
            riskLevel={workflow.risk.level}
            chips={[`payload ${telemetryPacket}`, hasHelpEvent ? "event packet" : "telemetry packet", "API ingest"]}
            onClick={() => select("packet", hasHelpEvent ? "bedside" : "wearable")}
          />
          <FlowConnector active={isActive("packet") && isActive("riskEngine")} />
          <ProcessNode
            stage="riskEngine"
            eyebrow="Risk engine pipeline"
            title="rule scoring + reason extraction"
            description="資料驗證、特徵抽取、類別 cap、理由去重與等級映射集中在 domain layer。"
            icon={ServerCog}
            kind="decision"
            active={isActive("riskEngine")}
            selected={isSelected("riskEngine")}
            riskLevel={workflow.risk.level}
            chips={["資料驗證", "類別化規則評分", "理由去重", workflow.risk.capped ? "capped 100" : `raw ${workflow.risk.rawScore}`]}
            onClick={() => select("riskEngine", "overview")}
          />
          <FlowConnector active={isActive("riskEngine") && isActive("triage")} />
          <ProcessNode
            stage="triage"
            eyebrow="Risk score / triage"
            title={`Risk Score ${workflow.risk.score}`}
            description={reasonPreview || "目前未觸發風險加分規則。"}
            icon={Activity}
            kind="decision"
            active={isActive("triage")}
            selected={isSelected("triage")}
            riskLevel={workflow.risk.level}
            metric={<b>{riskLevelLabel[workflow.risk.level]}</b>}
            chips={[riskLevelZhLabel[workflow.risk.level], `confidence ${workflow.risk.confidence}`, `dataQuality ${workflow.risk.dataQuality}`]}
            onClick={() => select("triage", "overview")}
          />
        </ProcessLane>

        <ProcessLane eyebrow="Care Coordination" title="處置閉環">
          <ProcessNode
            stage="queue"
            eyebrow="Care queue"
            title="照護協調隊列"
            description={`依風險排序：${queuePreview.join(" / ")}`}
            icon={ClipboardList}
            kind="action"
            active={isActive("queue")}
            selected={isSelected("queue")}
            riskLevel={workflow.risk.level}
            chips={["queue priority", "照護分級"]}
            onClick={() => select("queue", "team")}
          />
          <FlowConnector active={isActive("queue") && isActive("assignment")} />
          <ProcessNode
            stage="assignment"
            eyebrow="Assignment"
            title="分派 / 追蹤建議"
            description={`${careCase.patientId}｜${workflow.assignment.label}｜${workflow.assignment.description}`}
            icon={UserRoundCheck}
            kind="action"
            active={isActive("assignment")}
            selected={isSelected("assignment")}
            muted={!isActive("assignment")}
            riskLevel={workflow.risk.level}
            chips={workflow.assignment.assigned ? ["已分派", "care team notified"] : [workflow.assignment.label]}
            onClick={() => select("assignment", "team")}
          />
          <FlowConnector active={isActive("assignment") && isActive("feedback")} />
          <ProcessNode
            stage="feedback"
            eyebrow="Feedback"
            title="回覆與狀態同步"
            description={
              workflow.assignment.notifyFamily || workflow.assignment.notifyCareTeam
                ? "caregiver update、family / care team notified 與下一輪狀態更新。"
                : "維持例行觀察狀態同步，未觸發家屬或 care team 通知。"
            }
            icon={RefreshCcw}
            kind="feedback"
            active={isActive("feedback")}
            selected={isSelected("feedback")}
            muted={!isActive("feedback")}
            riskLevel={workflow.risk.level}
            chips={isActive("feedback") && workflow.assignment.stateUpdated ? ["caregiver update", "state updated"] : ["feedback pending"]}
            onClick={() => select("feedback", "team")}
          />
        </ProcessLane>
      </div>

      <SystemLayerLegend />
    </section>
  );
}
