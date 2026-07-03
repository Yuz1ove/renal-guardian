import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Award,
  BellRing,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  ClipboardList,
  Cpu,
  Database,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  ListChecks,
  Network,
  RefreshCcw,
  Route,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Watch,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CareProcessFlowCanvas } from "./CareProcessFlowCanvas";
import { buildWorkflowViewModel } from "../../domain/buildWorkflowViewModel";
import type { RiskReason, WorkflowStage, WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { mockCareCases } from "../../data/mockCareCases";
import { riskCategoryCaps, riskLevelLabel, riskLevelZhLabel } from "../../domain/riskScoring";
import { modeNarratives } from "./demoFlowData";
import { DeviceModuleCard } from "./DeviceModuleCard";
import { DemoModeTabs } from "./DemoModeTabs";
import { SystemLayerCards } from "./SystemLayerCards";
import { type DemoMode, scenePresets } from "./scenePresets";
import { CareQueuePanel } from "../dashboard/CareQueuePanel";
import { DataQualityCard } from "../dashboard/DataQualityCard";
import { RiskReasonList } from "../dashboard/RiskReasonList";
import { RiskScoreCard } from "../dashboard/RiskScoreCard";
import { TelemetryGrid } from "../dashboard/TelemetryGrid";
import { WristbandModuleSummary } from "../dashboard/WristbandModuleSummary";
import { CaseAnimationDemo } from "../case-demo/CaseAnimationDemo";
import { AssistiveDeviceDiagram } from "../assistive-design/AssistiveDeviceDiagram";
import { WearableFlowDemo } from "../../pages/WearableFlowDemo";
import { CareOperationsWorkbench } from "./CareOperationsWorkbench";
import { SystemRuntimeMonitor } from "./SystemRuntimeMonitor";
import "../../styles/care-demo.css";

type ConsoleViewId =
  | "overview"
  | "flow"
  | "wristband"
  | "riskEngine"
  | "careConsole"
  | "caseWalkthrough"
  | "deviceBlueprint"
  | "systemRuntime";

interface ConsoleViewMeta {
  id: ConsoleViewId;
  label: string;
  eyebrow: string;
  icon: LucideIcon;
}

interface JudgeStepMeta {
  id: string;
  title: string;
  view: ConsoleViewId;
  mode: DemoMode;
  stage?: WorkflowStage;
  lookHere: string;
  takeaway: string;
}

const consoleViews: ConsoleViewMeta[] = [
  { id: "overview", label: "總覽", eyebrow: "Overview", icon: LayoutDashboard },
  { id: "flow", label: "串聯流程", eyebrow: "Workflow Flow", icon: Network },
  { id: "wristband", label: "手環資料流", eyebrow: "Wristband Data Flow", icon: Watch },
  { id: "riskEngine", label: "風險引擎", eyebrow: "Risk Engine", icon: ServerCog },
  { id: "careConsole", label: "照護工作台", eyebrow: "Care Console", icon: ClipboardList },
  { id: "caseWalkthrough", label: "案例展示", eyebrow: "Case Walkthrough", icon: ListChecks },
  { id: "deviceBlueprint", label: "輔具設計圖", eyebrow: "Device Blueprint", icon: CircuitBoard },
  { id: "systemRuntime", label: "系統程式運行", eyebrow: "System Runtime", icon: GitBranch }
];

function isConsoleViewId(value: string): value is ConsoleViewId {
  return consoleViews.some((view) => view.id === value);
}

const judgeSteps: JudgeStepMeta[] = [
  {
    id: "overview",
    title: "系統總覽",
    view: "overview",
    mode: "overview",
    lookHere: "這裡展示系統如何把返家恢復期資料、求助事件、照護隊列與分派狀態收在同一個 Console。",
    takeaway: "先理解問題範圍與 demo 的資料來源，評審可以快速知道不是單一警報頁，而是照護協作系統。"
  },
  {
    id: "flow",
    title: "核心串聯流程",
    view: "flow",
    mode: "overview",
    stage: "packet",
    lookHere: "這裡展示資料如何從手環與床邊呼叫器進入 API、風險引擎、照護隊列與回寫流程。",
    takeaway: "請注意每個節點都讀同一份 workflow view model，避免展示與資料邏輯脫節。"
  },
  {
    id: "wristband",
    title: "手環資料流",
    view: "wristband",
    mode: "wearable",
    stage: "telemetry",
    lookHere: "這裡展示低資料量封包、BLE / Gateway ACK、弱訊號 retry 與 critical help_event priority queue。",
    takeaway: "手環頁說明為什麼求助事件不容易遺失：local buffer、retry queue、packetId、ACK 狀態與 lastSyncTime 都會被保留。"
  },
  {
    id: "risk-engine",
    title: "風險引擎",
    view: "riskEngine",
    mode: "overview",
    stage: "riskEngine",
    lookHere: "這裡展示 workflow.risk.score、rawScore、reasons、confidence 與 dataQuality 如何被拆解成可審查的表格。",
    takeaway: "評分不是任意加總，頁面會明確標示類別 cap、理由去重與資料品質保護機制。"
  },
  {
    id: "case-animation",
    title: "案例動畫",
    view: "caseWalkthrough",
    mode: "overview",
    lookHere: "這裡展示單一案例從狀態變化、求助封包、ACK、風險升級到照護到場的時間序。",
    takeaway: "動畫把抽象流程變成可被評審跟讀的事件流，並保留 runtime log 與封包摘要。"
  },
  {
    id: "device-blueprint",
    title: "輔具設計圖",
    view: "deviceBlueprint",
    mode: "overview",
    lookHere: "這裡展示手環、床邊呼叫器與照護端 dashboard 的硬體欄位、資料串接與弱網處理設計。",
    takeaway: "評審可以看到作品不是只有 UI，而是把輔具、資料流與照護流程一起設計。"
  },
  {
    id: "runtime",
    title: "系統程式運行",
    view: "systemRuntime",
    mode: "overview",
    stage: "riskEngine",
    lookHere: "這裡展示 event receiver、packet normalizer、risk engine、alert queue、dispatch、communication adapter 與 audit log。",
    takeaway: "這一步用類後端監控台說明系統如何運行，而不是只靠靜態簡報。"
  },
  {
    id: "submission-summary",
    title: "投稿亮點總結",
    view: "systemRuntime",
    mode: "overview",
    lookHere: "這裡整理可解釋風險、低資料量可靠傳輸、安全限制與投稿前工程驗收清單。",
    takeaway: "最後請看 Submission Readiness 面板，確認 demo guide、安全文案、無真實個資與本地驗收命令都已列出。"
  }
];

function judgeStepIndexFromId(stepId: string | undefined) {
  if (!stepId) return 0;
  const index = judgeSteps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

function parseConsoleHash():
  | { type: "judge"; stepIndex: number }
  | { type: "view"; view: ConsoleViewId }
  | null {
  if (typeof window === "undefined") return null;
  const hashView = window.location.hash.replace("#", "");
  if (hashView === "judge" || hashView.startsWith("judge:")) {
    return { type: "judge", stepIndex: judgeStepIndexFromId(hashView.split(":")[1]) };
  }
  return isConsoleViewId(hashView) ? { type: "view", view: hashView } : null;
}

function initialConsoleView(): ConsoleViewId {
  const parsed = parseConsoleHash();
  if (parsed?.type === "view") return parsed.view;
  if (parsed?.type === "judge") return judgeSteps[parsed.stepIndex]?.view ?? "overview";
  return "overview";
}

function initialJudgeStepIndex() {
  const parsed = parseConsoleHash();
  return parsed?.type === "judge" ? parsed.stepIndex : null;
}

const focusByView: Partial<Record<ConsoleViewId, { mode: DemoMode; stage?: WorkflowStage }>> = {
  overview: { mode: "overview" },
  flow: { mode: "overview" },
  wristband: { mode: "wearable", stage: "telemetry" },
  riskEngine: { mode: "overview", stage: "riskEngine" },
  careConsole: { mode: "team", stage: "queue" },
  caseWalkthrough: { mode: "overview" },
  deviceBlueprint: { mode: "overview" },
  systemRuntime: { mode: "overview", stage: "riskEngine" }
};

const categoryLabels: Record<RiskReason["category"], string> = {
  physiological: "生理訊號",
  activityRecovery: "活動與恢復趨勢",
  helpEvent: "求助事件",
  dataQuality: "資料品質"
};

const categoryOrder: RiskReason["category"][] = [
  "physiological",
  "activityRecovery",
  "helpEvent",
  "dataQuality"
];

const riskCategoryActions: Record<RiskReason["category"], string> = {
  physiological: "請照護端確認生命徵象趨勢，必要時安排人工複核。",
  activityRecovery: "納入返家恢復期追蹤，確認活動下降是否與疲倦或不適相關。",
  helpEvent: "求助事件進入照護確認與事件佇列，優先提醒照護團隊。",
  dataQuality: "提示重新佩戴、補測或檢查連線，不把低品質資料當成診斷結論。"
};

const safetyGuardrails = [
  "本系統不是醫療診斷工具；畫面中的分數與建議只用於展示照護協調流程。",
  "風險分數只作照護協調與異常提醒，協助照護端排序、追蹤與人工確認。",
  "119 升級為示範流程，正式部署需依機構 SOP、授權角色與在地緊急應變規範執行。",
  "展示資料皆為合成案例，不使用真實患者個資。",
  "感測資料只看趨勢、事件與資料品質，不取代醫師判斷。"
];

const validationChecklist = [
  { label: "npm run build", status: "Manual", note: "local validation before upload" },
  { label: "npm run validate:demo", status: "Manual", note: "risk and demo logic audit" },
  { label: "npm run validate:glb", status: "Manual", note: "3D model structure audit" },
  { label: "npm run validate:runtime", status: "Manual", note: "Playwright runtime smoke test" },
  { label: "npm run package:submission", status: "Manual", note: "generate final package" },
  { label: "npm run validate:submission", status: "Manual", note: "submission package audit" },
  { label: "No real patient data", status: "PASS", note: "synthetic demo IDs and anonymized names" },
  { label: "Medical safety copy present", status: "PASS", note: "guardrails are visible in the Console" },
  { label: "Mobile responsive checked", status: "Manual", note: "390 / 768 / 1024 px viewport review" },
  { label: "Demo guide available", status: "PASS", note: "Judge Mode guides the eight judging beats" }
] as const;

function viewTitle(viewId: ConsoleViewId) {
  return consoleViews.find((view) => view.id === viewId)?.label ?? "總覽";
}

function selectedPatientCopy(workflow: WorkflowViewModel) {
  return `${workflow.case.patientId}｜${riskLevelLabel[workflow.risk.level]}｜${workflow.assignment.label}`;
}

function ViewHeader({
  view,
  title,
  description,
  workflow
}: {
  view: ConsoleViewId;
  title: string;
  description: string;
  workflow: WorkflowViewModel;
}) {
  return (
    <header className="console-view-header">
      <div>
        <span>{consoleViews.find((item) => item.id === view)?.eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <aside>
        <b>{selectedPatientCopy(workflow)}</b>
        <small>{workflow.risk.safetyCopy}</small>
      </aside>
    </header>
  );
}

function PatientSwitcher({
  workflows,
  selectedPatientId,
  onSelectPatient
}: {
  workflows: WorkflowViewModel[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
}) {
  return (
    <div className="patient-switcher" aria-label="案例切換">
      {workflows.map((workflow) => (
        <button
          key={workflow.case.patientId}
          type="button"
          className={workflow.case.patientId === selectedPatientId ? "is-active" : ""}
          onClick={() => onSelectPatient(workflow.case.patientId)}
        >
          <span>{workflow.case.patientId}</span>
          <b>{workflow.risk.score}</b>
        </button>
      ))}
    </div>
  );
}

function JudgeGuide({
  stepIndex,
  onStart,
  onPrevious,
  onNext,
  onExit
}: {
  stepIndex: number | null;
  onStart: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
}) {
  const activeStep = stepIndex === null ? null : judgeSteps[stepIndex];

  return (
    <section className={`judge-guide${activeStep ? " is-active" : ""}`} aria-label="評審導覽模式">
      <header>
        <div>
          <span>Award Readiness Guide</span>
          <strong>評審導覽</strong>
          <p>依序走過系統總覽、串聯流程、手環資料流、風險引擎、案例動畫、輔具設計圖、runtime 與投稿亮點。</p>
        </div>
        <button type="button" className="judge-start-button" onClick={activeStep ? onExit : onStart}>
          {activeStep ? <X size={16} /> : <Award size={16} />}
          {activeStep ? "退出導覽" : "開始評審導覽"}
        </button>
      </header>

      {activeStep ? (
        <div className="judge-step-card">
          <div>
            <span>Step {stepIndex + 1} / {judgeSteps.length}</span>
            <h2>{activeStep.title}</h2>
            <p>
              <b>評審請看這裡：</b>
              {activeStep.lookHere}
            </p>
            <small>{activeStep.takeaway}</small>
          </div>
          <nav className="judge-step-controls" aria-label="評審導覽控制">
            <button type="button" onClick={onPrevious} disabled={stepIndex === 0}>
              <ChevronLeft size={16} />
              上一頁
            </button>
            <button type="button" onClick={onNext} disabled={stepIndex === judgeSteps.length - 1}>
              下一頁
              <ChevronRight size={16} />
            </button>
            <button type="button" onClick={onExit}>
              <X size={16} />
              退出導覽
            </button>
          </nav>
        </div>
      ) : null}
    </section>
  );
}

function ConsoleNav({
  activeView,
  onChangeView
}: {
  activeView: ConsoleViewId;
  onChangeView: (view: ConsoleViewId) => void;
}) {
  return (
    <nav className="console-nav" aria-label="Demo Console 導覽">
      {consoleViews.map((view) => {
        const Icon = view.icon;
        return (
          <button
            key={view.id}
            type="button"
            className={activeView === view.id ? "is-active" : ""}
            onClick={() => onChangeView(view.id)}
          >
            <Icon size={17} />
            <span>{view.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function OverviewView({
  workflow,
  workflows,
  onSelectPatient,
  onOpenView
}: {
  workflow: WorkflowViewModel;
  workflows: WorkflowViewModel[];
  onSelectPatient: (patientId: string) => void;
  onOpenView: (view: ConsoleViewId) => void;
}) {
  const highestRisk = workflows[0];
  const activeHelpEvents = workflows.filter((item) => item.case.helpEvent?.active).length;
  const selectedReasons = workflow.risk.reasons.filter((reason) => reason.points > 0).slice(0, 3);

  return (
    <section className="console-view" aria-label="系統總覽">
      <ViewHeader
        view="overview"
        title="系統總覽"
        description="把手環資料、求助事件、風險原因、照護隊列與分派狀態拆成可切換的 Demo Console。"
        workflow={workflow}
      />

      <div className="overview-grid">
        <section className="console-summary-panel">
          <div className="summary-kicker">
            <Database size={18} />
            <span>Command Center Snapshot</span>
          </div>
          <h3>洗腎返家恢復期照護協作總覽</h3>
          <p>
            目前載入 {workflows.length} 個展示案例；selectedPatientId 是全站共用狀態，所有區塊都從同一份 workflow view model 讀取資料。
          </p>
          <div className="summary-metrics">
            <article>
              <span>最高排序</span>
              <strong>{highestRisk.case.patientId}</strong>
              <small>{riskLevelLabel[highestRisk.risk.level]}｜{highestRisk.assignment.label}</small>
            </article>
            <article>
              <span>求助事件</span>
              <strong>{activeHelpEvents}</strong>
              <small>active event packets</small>
            </article>
            <article>
              <span>目前案例</span>
              <strong>{workflow.risk.score}</strong>
              <small>{riskLevelZhLabel[workflow.risk.level]}</small>
            </article>
            <article>
              <span>資料品質</span>
              <strong>{workflow.risk.dataQuality}</strong>
              <small>confidence {workflow.risk.confidence}</small>
            </article>
          </div>
          <div className="summary-actions">
            <button type="button" onClick={() => onOpenView("flow")}>
              <Network size={16} />
              串聯流程
            </button>
            <button type="button" onClick={() => onOpenView("careConsole")}>
              <ClipboardList size={16} />
              照護工作台
            </button>
          </div>
        </section>

        <section className="selected-case-panel">
          <header>
            <HeartPulse size={18} />
            <div>
              <span>Selected Case</span>
              <strong>{workflow.case.patientId}｜{workflow.case.displayName}</strong>
            </div>
          </header>
          <p>{workflow.assignment.description}</p>
          <ul>
            {selectedReasons.length ? (
              selectedReasons.map((reason) => (
                <li key={reason.id}>
                  <span>{categoryLabels[reason.category]}</span>
                  <b>{reason.label}</b>
                </li>
              ))
            ) : (
              <li>
                <span>風險原因</span>
                <b>目前未觸發風險加分規則</b>
              </li>
            )}
          </ul>
        </section>
      </div>

      <SafetyGuardrailsPanel />
      <SystemLayerCards />
      <CareQueuePanel workflows={workflows} selectedPatientId={workflow.case.patientId} onSelectPatient={onSelectPatient} />
    </section>
  );
}

function SafetyGuardrailsPanel() {
  return (
    <section className="safety-guardrails-panel" aria-label="安全與限制">
      <header>
        <ShieldAlert size={18} />
        <div>
          <span>Medical / Ethical Safety Guardrails</span>
          <strong>安全與限制</strong>
        </div>
      </header>
      <ul>
        {safetyGuardrails.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function WorkflowFlowView({
  workflow,
  workflows,
  mode,
  selectedStage,
  onModeChange,
  onStageSelect
}: {
  workflow: WorkflowViewModel;
  workflows: WorkflowViewModel[];
  mode: DemoMode;
  selectedStage?: WorkflowStage;
  onModeChange: (mode: DemoMode) => void;
  onStageSelect: (stage: WorkflowStage) => void;
}) {
  return (
    <section className="console-view flow-view" aria-label="核心串聯流程">
      <ViewHeader
        view="flow"
        title="核心串聯流程"
        description="主展示畫面獨立呈現資料來源、API ingest、risk engine、care queue、assignment 與 feedback loop。"
        workflow={workflow}
      />
      <CareProcessFlowCanvas
        mode={mode}
        workflow={workflow}
        queueWorkflows={workflows}
        onModeChange={onModeChange}
        selectedStage={selectedStage}
        onStageSelect={onStageSelect}
      />
      <div className="flow-support-grid">
        <DemoModeTabs mode={mode} onChange={onModeChange} />
        <DeviceModuleCard mode={mode} workflow={workflow} queueWorkflows={workflows} />
      </div>
    </section>
  );
}

function WristbandSourceView({
  workflow,
  workflows
}: {
  workflow: WorkflowViewModel;
  workflows: WorkflowViewModel[];
}) {
  return (
    <section className="console-view" aria-label="手環資料來源">
      <ViewHeader
        view="wristband"
        title="手環資料來源"
        description="集中查看低資料量 telemetry、手環模組、BLE / gateway 轉送與資料限制，不混入完整照護 dashboard。"
        workflow={workflow}
      />
      <TelemetryGrid workflow={workflow} highlighted />
      <div className="source-grid">
        <WristbandModuleSummary workflow={workflow} />
        <section className="data-policy-panel">
          <header>
            <Cpu size={18} />
            <div>
              <span>Data Policy</span>
              <strong>低資料量與資料邊界</strong>
            </div>
          </header>
          <dl>
            <div>
              <dt>sampling</dt>
              <dd>{workflow.wristbandCapability.dataPolicy.samplingMode}</dd>
            </div>
            <div>
              <dt>payload</dt>
              <dd>{workflow.wristbandCapability.dataPolicy.lowDataPayloadKb} KB</dd>
            </div>
            <div>
              <dt>connectivity</dt>
              <dd>{workflow.wristbandCapability.connectivity.primary} / gateway required</dd>
            </div>
          </dl>
          <ul>
            {workflow.wristbandCapability.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      </div>
      <DeviceModuleCard mode="wearable" workflow={workflow} queueWorkflows={workflows} />
    </section>
  );
}

function RiskScoreBreakdown({ workflow }: { workflow: WorkflowViewModel }) {
  const rows = categoryOrder.map((category) => {
    const reasons = workflow.risk.reasons.filter((reason) => reason.category === category && reason.points > 0);
    const rawPoints = reasons.reduce((total, reason) => total + reason.points, 0);
    const cappedPoints = Math.min(rawPoints, riskCategoryCaps[category]);

    return {
      category,
      trigger: reasons.length ? reasons.map((reason) => reason.label).join("；") : "未觸發加分條件",
      score: rawPoints > cappedPoints ? `${cappedPoints} / raw ${rawPoints}` : `${cappedPoints}`,
      protection:
        category === "dataQuality"
          ? `資料品質保護：dataQuality ${workflow.risk.dataQuality}，confidence ${workflow.risk.confidence}，最多 +${riskCategoryCaps[category]}`
          : `類別 cap +${riskCategoryCaps[category]}；reason.id 去重後才納入`,
      action: riskCategoryActions[category]
    };
  });
  const uniqueReasonIds = new Set(workflow.risk.reasons.map((reason) => reason.id)).size;

  return (
    <section className="score-breakdown-panel" aria-label="Score Breakdown 分數拆解">
      <header>
        <div>
          <span>Score Breakdown / 分數拆解</span>
          <strong>風險分數可解釋性</strong>
          <p>此分數用於照護協調與異常提醒，不是醫療診斷或治療建議。</p>
        </div>
      </header>

      <div className="breakdown-summary-grid">
        <article>
          <span>workflow.risk.score</span>
          <b>{workflow.risk.score}</b>
          <small>final display score</small>
        </article>
        <article>
          <span>workflow.risk.rawScore</span>
          <b>{workflow.risk.rawScore}</b>
          <small>{workflow.risk.capped ? "capped at 100" : "no global cap applied"}</small>
        </article>
        <article>
          <span>workflow.risk.confidence</span>
          <b>{workflow.risk.confidence}</b>
          <small>derived from data quality</small>
        </article>
        <article>
          <span>workflow.risk.dataQuality</span>
          <b>{workflow.risk.dataQuality}</b>
          <small>{workflow.risk.dataQualityNotes.length ? "review notes present" : "trend data usable"}</small>
        </article>
      </div>

      <div className="breakdown-guardrail-strip" aria-label="score protection mechanisms">
        <span>類別 cap：生理 {riskCategoryCaps.physiological} / 活動 {riskCategoryCaps.activityRecovery} / 求助 {riskCategoryCaps.helpEvent} / 品質 {riskCategoryCaps.dataQuality}</span>
        <span>理由去重：{uniqueReasonIds} unique reason id(s)</span>
        <span>資料品質：{workflow.risk.dataQuality} / confidence {workflow.risk.confidence}</span>
      </div>

      <div className="score-breakdown-table">
        <table>
          <thead>
            <tr>
              <th>類別</th>
              <th>觸發條件</th>
              <th>分數</th>
              <th>上限或保護機制</th>
              <th>對應照護動作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td>{categoryLabels[row.category]}</td>
                <td>{row.trigger}</td>
                <td>{row.score}</td>
                <td>{row.protection}</td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RiskEngineView({ workflow }: { workflow: WorkflowViewModel }) {
  const scoredReasons = workflow.risk.reasons.filter((reason) => reason.points > 0);
  const categories = Array.from(new Set(workflow.risk.reasons.map((reason) => reason.category)));

  return (
    <section className="console-view" aria-label="風險評估引擎">
      <ViewHeader
        view="riskEngine"
        title="風險評估引擎"
        description="展示 domain layer 產出的分數、資料品質、原因清單與規則流程；此頁不重新計算 risk score。"
        workflow={workflow}
      />
      <div className="risk-engine-grid">
        <RiskScoreCard workflow={workflow} />
        <section className="engine-pipeline-panel">
          <header>
            <GitBranch size={18} />
            <div>
              <span>Rule Pipeline</span>
              <strong>單一 workflow VM 產出</strong>
            </div>
          </header>
          <ol>
            <li>
              <b>資料驗證</b>
              <span>HR / SpO2 / 活動量 / payload / lastSyncTime</span>
            </li>
            <li>
              <b>特徵抽取</b>
              <span>{categories.map((category) => categoryLabels[category]).join("、")}</span>
            </li>
            <li>
              <b>類別 cap 與理由去重</b>
              <span>{scoredReasons.length} 個加分理由｜raw {workflow.risk.rawScore}</span>
            </li>
            <li>
              <b>等級映射</b>
              <span>{workflow.risk.score} / {riskLevelLabel[workflow.risk.level]} / {riskLevelZhLabel[workflow.risk.level]}</span>
            </li>
          </ol>
        </section>
        <RiskScoreBreakdown workflow={workflow} />
        <RiskReasonList workflow={workflow} />
        <DataQualityCard workflow={workflow} />
        <SafetyGuardrailsPanel />
      </div>
    </section>
  );
}

function CareConsoleView({
  workflow,
  onSelectPatient
}: {
  workflow: WorkflowViewModel;
  onSelectPatient: (patientId: string) => void;
}) {
  return (
    <section className="console-view" aria-label="照護協調工作台">
      <ViewHeader
        view="careConsole"
        title="照護工作台"
        description="居服員、守望隊與照護協調員使用的操作端，從警報佇列、個案狀態、派工、低資料量確認到事件解除形成完整狀態機。"
        workflow={workflow}
      />
      <CareOperationsWorkbench selectedPatientId={workflow.case.patientId} onSelectPatient={onSelectPatient} />
    </section>
  );
}

function CaseWalkthroughView({ workflow }: { workflow: WorkflowViewModel }) {
  return (
    <section className="console-view" aria-label="案例展示">
      <ViewHeader
        view="caseWalkthrough"
        title="案例動畫展示區"
        description="以同一條 timeline 同步呈現患者狀態、手環資料、BLE 傳輸、後端 log、風險分數、照護警報與到場處置。"
        workflow={workflow}
      />
      <CaseAnimationDemo />
    </section>
  );
}

function DeviceBlueprintView({ workflow }: { workflow: WorkflowViewModel }) {
  return (
    <section className="console-view device-blueprint-view" aria-label="輔具設計圖">
      <ViewHeader
        view="deviceBlueprint"
        title="輔具設計圖"
        description="以白底硬體剖面圖標註監測手環、床邊呼叫器與資料串接欄位，呈現弱網處理與風險評估關聯。"
        workflow={workflow}
      />
      <AssistiveDeviceDiagram baseRiskScore={workflow.risk.score} patientId={workflow.case.patientId} />
    </section>
  );
}

function SubmissionReadinessPanel() {
  return (
    <section className="submission-readiness-panel" aria-label="Submission Readiness 驗收面板">
      <header>
        <ClipboardList size={18} />
        <div>
          <span>Submission Readiness / 驗收面板</span>
          <strong>投稿亮點總結與工程驗收清單</strong>
          <p>此區把評審展示、醫療安全邊界、封包可靠度與本地驗證命令整理成投稿前檢查表。</p>
        </div>
      </header>

      <div className="submission-highlight-grid">
        <article>
          <span>Explainable Risk</span>
          <b>分數拆解可審查</b>
          <p>workflow.risk.reasons、score、rawScore、confidence、dataQuality 都能在 Console 看到。</p>
        </article>
        <article>
          <span>Reliable Packet</span>
          <b>help_event 優先傳送</b>
          <p>local buffer、retry queue、packetId、ACK chain 與 lastSyncTime 明確呈現。</p>
        </article>
        <article>
          <span>Safety Design</span>
          <b>不是醫療診斷</b>
          <p>安全與限制文案放在主要流程中，避免評審誤解為診斷或治療建議。</p>
        </article>
      </div>

      <div className="readiness-table">
        <table>
          <thead>
            <tr>
              <th>檢查項目</th>
              <th>status</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            {validationChecklist.map((item) => (
              <tr key={item.label}>
                <td>{item.label}</td>
                <td>
                  <span className={`readiness-status status-${item.status.toLowerCase()}`}>{item.status}</span>
                </td>
                <td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SystemRuntimeView({ workflow }: { workflow: WorkflowViewModel }) {
  return (
    <section className="console-view" aria-label="系統程式運行">
      <ViewHeader
        view="systemRuntime"
        title="系統程式運行"
        description="以後端程式運行監控台呈現 event receiver、normalizer、risk engine、alert queue、dispatch、communication adapter 與 audit log。"
        workflow={workflow}
      />
      <SystemRuntimeMonitor />
      <SubmissionReadinessPanel />
    </section>
  );
}

export function CareDemoPage() {
  const [mode, setMode] = useState<DemoMode>("overview");
  const [activeView, setActiveView] = useState<ConsoleViewId>(() => initialConsoleView());
  const [judgeStepIndex, setJudgeStepIndex] = useState<number | null>(() => initialJudgeStepIndex());
  const [selectedPatientId, setSelectedPatientId] = useState("A-203");
  const [selectedStage, setSelectedStage] = useState<WorkflowStage | undefined>();
  const [feedback, setFeedback] = useState(modeNarratives.overview.body);
  const [toast, setToast] = useState("");
  const workflows = useMemo(
    () =>
      mockCareCases
        .map((careCase) => buildWorkflowViewModel(careCase))
        .sort((a, b) => b.risk.score - a.risk.score),
    []
  );
  const selectedWorkflow =
    workflows.find((workflow) => workflow.case.patientId === selectedPatientId) ??
    workflows[0];

  useEffect(() => {
    function syncViewFromHash() {
      const parsed = parseConsoleHash();
      if (!parsed) return;

      if (parsed.type === "judge") {
        const step = judgeSteps[parsed.stepIndex] ?? judgeSteps[0];
        setJudgeStepIndex(parsed.stepIndex);
        setActiveView(step.view);
        setSelectedStage(step.stage);
        setMode(step.mode);
        setToast("");
        setFeedback(`評審導覽 ${parsed.stepIndex + 1}/${judgeSteps.length}：${step.title}。${step.lookHere}`);
        return;
      }

      const focus = focusByView[parsed.view];
      setJudgeStepIndex(null);
      setActiveView(parsed.view);
      setSelectedStage(focus?.stage);
      if (focus?.mode) setMode(focus.mode);
    }

    syncViewFromHash();
    window.addEventListener("hashchange", syncViewFromHash);
    return () => window.removeEventListener("hashchange", syncViewFromHash);
  }, []);

  if (!selectedWorkflow) return null;

  function selectPatient(patientId: string) {
    const workflow =
      workflows.find((item) => item.case.patientId === patientId) ??
      selectedWorkflow;
    setSelectedPatientId(workflow.case.patientId);
    setSelectedStage(undefined);
    setToast("");
    setFeedback(`${workflow.case.patientId} 已載入：${riskLevelLabel[workflow.risk.level]}｜${workflow.assignment.label}。流程圖、原因清單與時間序已同步。`);
  }

  function changeView(nextView: ConsoleViewId) {
    const focus = focusByView[nextView];
    setJudgeStepIndex(null);
    setActiveView(nextView);
    if (typeof window !== "undefined" && window.location.hash !== `#${nextView}`) {
      window.history.replaceState(null, "", `#${nextView}`);
    }
    setToast("");
    setSelectedStage(focus?.stage);
    if (focus?.mode) setMode(focus.mode);
    setFeedback(`${viewTitle(nextView)} 已載入：${selectedPatientCopy(selectedWorkflow)}。`);
  }

  function applyJudgeStep(nextIndex: number) {
    const clamped = Math.max(0, Math.min(judgeSteps.length - 1, nextIndex));
    const step = judgeSteps[clamped];
    setJudgeStepIndex(clamped);
    setActiveView(step.view);
    setSelectedStage(step.stage);
    setMode(step.mode);
    setToast("");
    setFeedback(`評審導覽 ${clamped + 1}/${judgeSteps.length}：${step.title}。${step.lookHere}`);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#judge:${step.id}`);
    }
  }

  function exitJudgeMode() {
    setJudgeStepIndex(null);
    setToast("");
    setFeedback(`${viewTitle(activeView)} 已載入：${selectedPatientCopy(selectedWorkflow)}。`);
    if (typeof window !== "undefined" && window.location.hash.startsWith("#judge")) {
      window.history.replaceState(null, "", `#${activeView}`);
    }
  }

  function changeMode(nextMode: DemoMode) {
    setMode(nextMode);
    setSelectedStage(undefined);
    if (nextMode === "bedside") {
      setFeedback("床邊求助事件會以 event packet 進入 API / risk engine，並出現在風險原因與時間序。");
    } else if (nextMode === "team") {
      setFeedback("照護隊列依分級排序，分派狀態與 caregiver update 會回寫到狀態同步。");
    } else if (nextMode === "wearable") {
      setFeedback("手環資料以低資料量 telemetry packet 送往 API，保留 HR、SpO2、活動量與訊號狀態。");
    } else {
      setFeedback(modeNarratives.overview.body);
    }
  }

  function selectStage(stage: WorkflowStage) {
    setSelectedStage(stage);
    setActiveView("flow");
    setFeedback(`${stage} 節點已聚焦；中央流程與右側結果面板使用同一份 workflow view model。`);
  }

  function receiveWearablePacket() {
    setActiveView("wristband");
    setMode("wearable");
    setSelectedPatientId("A-203");
    setSelectedStage("telemetry");
    setFeedback("已接收 A-203 手環低資料量封包，HR / SpO2 / 活動量同步更新。");
    setToast("已接收 A-203 手環低資料量封包");
  }

  function triggerBedsideEvent() {
    setActiveView("flow");
    setMode("bedside");
    setSelectedPatientId("A-203");
    setSelectedStage("helpEvent");
    setFeedback("已建立 A-203 求助事件，等待照護確認。");
    setToast("已建立 A-203 求助事件，等待照護確認");
  }

  function focusA203() {
    setActiveView("careConsole");
    setMode("team");
    setSelectedPatientId("A-203");
    setSelectedStage("assignment");
    setFeedback("已同步 A-203 分派狀態與照護團隊通知。");
    setToast("已同步 A-203 分派狀態與照護團隊通知");
  }

  return (
    <main className="care-demo-page demo-console-page">
      <section className="demo-console-shell" aria-label="腎安洗腎返家恢復期照護協作系統 Demo Console">
        <JudgeGuide
          stepIndex={judgeStepIndex}
          onStart={() => applyJudgeStep(0)}
          onPrevious={() => applyJudgeStep((judgeStepIndex ?? 0) - 1)}
          onNext={() => applyJudgeStep((judgeStepIndex ?? 0) + 1)}
          onExit={exitJudgeMode}
        />

        <header className="console-topbar">
          <div className="console-brand">
            <span>AI Care Coordination Demo Console</span>
            <h1>腎安</h1>
            <p>洗腎返家恢復期照護協作系統</p>
          </div>
          <div className="console-case-control">
            <span>Selected Patient</span>
            <PatientSwitcher
              workflows={workflows}
              selectedPatientId={selectedWorkflow.case.patientId}
              onSelectPatient={selectPatient}
            />
          </div>
        </header>

        <ConsoleNav activeView={activeView} onChangeView={changeView} />

        <div className="console-status-strip" aria-live="polite">
          {toast ? <p className="toast-line">{toast}</p> : null}
          <p className="feedback-line">{feedback || scenePresets[mode].description}</p>
        </div>

        {activeView === "overview" ? (
          <OverviewView
            workflow={selectedWorkflow}
            workflows={workflows}
            onSelectPatient={selectPatient}
            onOpenView={changeView}
          />
        ) : null}

        {activeView === "flow" ? (
          <WorkflowFlowView
            workflow={selectedWorkflow}
            workflows={workflows}
            mode={mode}
            selectedStage={selectedStage}
            onModeChange={changeMode}
            onStageSelect={selectStage}
          />
        ) : null}

        {activeView === "wristband" ? (
          <WearableFlowDemo
            patientId={selectedWorkflow.case.patientId}
            displayName={selectedWorkflow.case.displayName}
          />
        ) : null}

        {activeView === "riskEngine" ? (
          <RiskEngineView workflow={selectedWorkflow} />
        ) : null}

        {activeView === "careConsole" ? (
          <CareConsoleView
            workflow={selectedWorkflow}
            onSelectPatient={selectPatient}
          />
        ) : null}

        {activeView === "caseWalkthrough" ? (
          <CaseWalkthroughView workflow={selectedWorkflow} />
        ) : null}

        {activeView === "deviceBlueprint" ? (
          <DeviceBlueprintView workflow={selectedWorkflow} />
        ) : null}

        {activeView === "systemRuntime" ? (
          <SystemRuntimeView workflow={selectedWorkflow} />
        ) : null}
      </section>
    </main>
  );
}
