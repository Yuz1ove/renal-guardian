import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BellRing,
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
  ShieldCheck,
  Watch
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CareProcessFlowCanvas } from "./CareProcessFlowCanvas";
import { buildWorkflowViewModel } from "../../domain/buildWorkflowViewModel";
import type { RiskReason, WorkflowStage, WorkflowViewModel } from "../../domain/careWorkflowTypes";
import { mockCareCases } from "../../data/mockCareCases";
import { riskLevelLabel, riskLevelZhLabel } from "../../domain/riskScoring";
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

function initialConsoleView(): ConsoleViewId {
  if (typeof window === "undefined") return "overview";
  const hashView = window.location.hash.replace("#", "");
  return isConsoleViewId(hashView) ? hashView : "overview";
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

      <SystemLayerCards />
      <CareQueuePanel workflows={workflows} selectedPatientId={workflow.case.patientId} onSelectPatient={onSelectPatient} />
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
        <RiskReasonList workflow={workflow} />
        <DataQualityCard workflow={workflow} />
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
    <section className="console-view" aria-label="輔具設計圖">
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
    </section>
  );
}

export function CareDemoPage() {
  const [mode, setMode] = useState<DemoMode>("overview");
  const [activeView, setActiveView] = useState<ConsoleViewId>(() => initialConsoleView());
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
      const hashView = window.location.hash.replace("#", "");
      if (!isConsoleViewId(hashView)) return;
      const focus = focusByView[hashView];
      setActiveView(hashView);
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
    setActiveView(nextView);
    if (typeof window !== "undefined" && window.location.hash !== `#${nextView}`) {
      window.history.replaceState(null, "", `#${nextView}`);
    }
    setToast("");
    setSelectedStage(focus?.stage);
    if (focus?.mode) setMode(focus.mode);
    setFeedback(`${viewTitle(nextView)} 已載入：${selectedPatientCopy(selectedWorkflow)}。`);
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
