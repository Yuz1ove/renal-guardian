import { renalRecoveryWristbandCapability } from "../data/wristbandCapabilities";
import type {
  CareActionType,
  CareAssignment,
  CareCase,
  DashboardCard,
  RiskLevel,
  TimelineItem,
  WorkflowStage,
  WorkflowViewModel
} from "./careWorkflowTypes";
import { calculateRisk, riskLevelLabel, riskLevelZhLabel } from "./riskScoring";

const timelineTimesByPatientId: Record<string, Partial<Record<WorkflowStage, string>>> = {
  "A-203": {
    patient: "17:05",
    wristband: "17:08",
    telemetry: "17:08",
    helpEvent: "17:09",
    packet: "17:09",
    riskEngine: "17:10",
    triage: "17:11",
    queue: "17:11",
    assignment: "17:12",
    feedback: "17:13"
  },
  "A-118": {
    patient: "17:10",
    wristband: "17:14",
    telemetry: "17:14",
    helpEvent: "17:14",
    packet: "17:14",
    riskEngine: "17:15",
    triage: "17:15",
    queue: "17:16",
    assignment: "17:46",
    feedback: "待回覆"
  },
  "A-076": {
    patient: "17:16",
    wristband: "17:20",
    telemetry: "17:20",
    helpEvent: "待命",
    packet: "17:20",
    riskEngine: "17:21",
    triage: "17:21",
    queue: "17:22",
    assignment: "例行",
    feedback: "例行"
  }
};

const fallbackTimes = timelineTimesByPatientId["A-203"];

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

function buildAssignment(level: RiskLevel): CareAssignment {
  const assignments: Record<RiskLevel, CareAssignment> = {
    stable: {
      actionType: "routineObservation",
      label: "例行觀察",
      description: "生命徵象與活動趨勢穩定，維持例行觀察。",
      assigned: false,
      notifyFamily: false,
      notifyCareTeam: false,
      stateUpdated: true
    },
    watch: {
      actionType: "watchQueue",
      label: "排入觀察隊列",
      description: "有輕度異常或資料品質限制，建議照護人員確認趨勢。",
      assigned: false,
      notifyFamily: false,
      notifyCareTeam: true,
      stateUpdated: true
    },
    warning: {
      actionType: "followUp30Min",
      label: "30 分鐘內追蹤",
      description: "返家恢復期出現多項風險訊號，建議照護人員於 30 分鐘內確認。",
      assigned: false,
      notifyFamily: false,
      notifyCareTeam: true,
      stateUpdated: true
    },
    critical: {
      actionType: "assignedCaregiver",
      label: "已分派照護人員",
      description: "多項風險訊號與求助事件同時出現，已進入最高照護協作優先級。",
      assigned: true,
      notifyFamily: true,
      notifyCareTeam: true,
      stateUpdated: true
    }
  };

  return assignments[level];
}

function buildDashboardCards(careCase: CareCase): DashboardCard[] {
  const { telemetry, recoveryContext } = careCase;

  return [
    {
      id: "hr",
      label: "HR",
      value: formatNumber(telemetry.hr, " bpm"),
      helper: typeof telemetry.hr === "number" && telemetry.hr <= 60 ? "列入觀察" : "趨勢可用"
    },
    {
      id: "spo2",
      label: "SpO2",
      value: formatNumber(telemetry.spo2, "%"),
      helper: typeof telemetry.spo2 === "number" && telemetry.spo2 <= 95 ? "列入觀察" : "趨勢可用"
    },
    {
      id: "activity",
      label: "活動量下降",
      value: formatNumber(telemetry.activityDropPercent, "%"),
      helper:
        typeof telemetry.activityDropPercent === "number" && telemetry.activityDropPercent >= 20
          ? "恢復期活動下降"
          : "例行變化"
    },
    {
      id: "payload",
      label: "封包大小",
      value: `${Math.max(0, telemetry.payloadSizeKb).toFixed(1)} KB`,
      helper: "low-data packet"
    },
    {
      id: "signal",
      label: "訊號狀態",
      value: signalLabel(telemetry.signalStatus),
      helper: telemetry.signalStatus === "normal" ? "資料品質 good" : "資料需確認"
    },
    {
      id: "sync",
      label: "最後回傳",
      value: telemetry.lastSyncTime || "資料需確認",
      helper: recoveryContext ? `透析後 ${recoveryContext.afterDialysisHours} 小時` : "返家恢復期"
    }
  ];
}

function baseStagesForLevel(level: RiskLevel): WorkflowStage[] {
  const common: WorkflowStage[] = ["patient", "wristband", "telemetry", "packet", "riskEngine", "triage", "queue"];
  if (level === "warning") return [...common, "assignment"];
  if (level === "critical") return ["patient", "wristband", "telemetry", "helpEvent", "packet", "riskEngine", "triage", "queue", "assignment", "feedback"];
  return common;
}

function buildActiveStages(careCase: CareCase, level: RiskLevel): WorkflowStage[] {
  const stages = baseStagesForLevel(level);
  if (careCase.helpEvent?.active && !stages.includes("helpEvent")) {
    const telemetryIndex = stages.indexOf("telemetry");
    stages.splice(telemetryIndex + 1, 0, "helpEvent");
  }
  return stages;
}

function timeFor(careCase: CareCase, stage: WorkflowStage) {
  return timelineTimesByPatientId[careCase.patientId]?.[stage] ?? fallbackTimes[stage] ?? "--";
}

function item(
  id: string,
  time: string,
  stage: WorkflowStage,
  title: string,
  description: string,
  status: TimelineItem["status"]
): TimelineItem {
  return { id, time, stage, title, description, status };
}

function buildTimeline(careCase: CareCase, workflow: Pick<WorkflowViewModel, "risk" | "assignment">): TimelineItem[] {
  const helpEvent = careCase.helpEvent;
  const hasHelpEvent = Boolean(helpEvent?.active);
  const levelLabel = `${riskLevelLabel[workflow.risk.level]} / ${riskLevelZhLabel[workflow.risk.level]}`;
  const assignmentStatus: TimelineItem["status"] =
    workflow.assignment.assigned || workflow.assignment.actionType === "routineObservation" ? "done" : "active";
  const feedbackStatus: TimelineItem["status"] =
    workflow.assignment.stateUpdated && workflow.risk.level !== "warning" ? "done" : workflow.risk.level === "warning" ? "pending" : "done";

  const timeline: TimelineItem[] = [
    item(
      `${careCase.patientId}-wristband`,
      timeFor(careCase, "wristband"),
      "wristband",
      "手環低資料量封包回傳",
      `payload ${careCase.telemetry.payloadSizeKb.toFixed(1)} KB｜${signalLabel(careCase.telemetry.signalStatus)}｜${careCase.telemetry.lastSyncTime}`,
      "done"
    )
  ];

  if (hasHelpEvent && helpEvent) {
    timeline.push(
      item(
        `${careCase.patientId}-help-event`,
        helpEvent.createdAt.slice(0, 5),
        "helpEvent",
        "求助事件建立",
        `${sourceLabel(helpEvent.source)}｜${helpEvent.symptoms.join("、")}｜priority ${helpEvent.priority}`,
        "done"
      )
    );
  } else {
    timeline.push(
      item(
        `${careCase.patientId}-help-event`,
        timeFor(careCase, "helpEvent"),
        "helpEvent",
        "求助事件入口待命",
        "目前無主動求助事件。",
        "pending"
      )
    );
  }

  timeline.push(
    item(
      `${careCase.patientId}-packet`,
      timeFor(careCase, "packet"),
      "packet",
      "telemetry / event packet 進入 API",
      hasHelpEvent ? "telemetry packet + event packet 合併送入。" : "telemetry packet 送入 API ingest。",
      "done"
    ),
    item(
      `${careCase.patientId}-risk-engine`,
      timeFor(careCase, "riskEngine"),
      "riskEngine",
      "risk engine 完成計算",
      `資料驗證、特徵抽取、類別化規則評分、理由去重、等級映射完成。`,
      "done"
    ),
    item(
      `${careCase.patientId}-triage`,
      timeFor(careCase, "triage"),
      "triage",
      `照護分級更新為 ${levelLabel}`,
      `final score ${workflow.risk.score}｜${workflow.assignment.label}`,
      "done"
    ),
    item(
      `${careCase.patientId}-queue`,
      timeFor(careCase, "queue"),
      "queue",
      "照護隊列更新",
      `${careCase.patientId} 已依照分數、原因與資料品質進入 care queue。`,
      "done"
    ),
    item(
      `${careCase.patientId}-assignment`,
      timeFor(careCase, "assignment"),
      "assignment",
      workflow.assignment.label,
      workflow.assignment.description,
      assignmentStatus
    ),
    item(
      `${careCase.patientId}-feedback`,
      timeFor(careCase, "feedback"),
      "feedback",
      feedbackStatus === "pending" ? "caregiver update pending" : "state updated",
      feedbackStatus === "pending"
        ? "等待照護端回覆後同步狀態。"
        : workflow.assignment.notifyFamily || workflow.assignment.notifyCareTeam
          ? "family / care team notified，照護狀態已同步。"
          : "維持例行觀察狀態同步。",
      feedbackStatus
    )
  );

  if (workflow.risk.level === "stable") {
    return timeline.filter((entry) => entry.stage !== "assignment" || entry.status === "done");
  }

  return timeline;
}

export function buildWorkflowViewModel(careCase: CareCase): WorkflowViewModel {
  const risk = calculateRisk(careCase);
  const assignment = buildAssignment(risk.level);
  const partialWorkflow = { risk, assignment };

  return {
    case: careCase,
    risk,
    assignment,
    timeline: buildTimeline(careCase, partialWorkflow),
    activeStages: buildActiveStages(careCase, risk.level),
    dashboardCards: buildDashboardCards(careCase),
    wristbandCapability: renalRecoveryWristbandCapability
  };
}

export function actionTypeLabel(actionType: CareActionType) {
  const labels: Record<CareActionType, string> = {
    routineObservation: "例行觀察",
    watchQueue: "排入觀察隊列",
    followUp30Min: "30 分鐘內追蹤",
    assignedCaregiver: "已分派照護人員",
    escalate: "升級照護確認"
  };
  return labels[actionType];
}
