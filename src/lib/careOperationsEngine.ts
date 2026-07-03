import type {
  AlertCase,
  AlertStatus,
  CaseActionStatuses,
  CareDemoState,
  AuditLogEntry,
  CareWorkflowAction,
  CareWorker,
  DeliveryStatus,
  EmergencyFlowNode,
  EmergencyFlowStatus,
  GeneratedCareEventKind,
  OperationRiskLevel,
  OperationsHelpEvent,
  PatientStatus,
  ReplyState,
  RiskAssessment,
  WeakNetworkPacket
} from "../types/careOperations";

const nowIso = () => new Date().toISOString();

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function mapOperationRiskLevel(score: number): OperationRiskLevel {
  if (score >= 90) return "critical";
  if (score >= 60) return "warning";
  if (score >= 30) return "watch";
  return "stable";
}

export const operationRiskLabel: Record<OperationRiskLevel, string> = {
  stable: "Stable",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical"
};

export const alertStatusLabel: Record<AlertStatus, string> = {
  pending: "pending",
  assigned: "assigned",
  contacting: "contacting",
  acknowledged: "acknowledged",
  on_the_way: "on_the_way",
  arrived: "arrived",
  resolved: "resolved",
  no_response: "no_response"
};

function recommendedActionFor(score: number, patientStatus: PatientStatus, replyState?: ReplyState) {
  if (replyState?.replyCode === 5) return "患者請求立即派人，建議同步守望隊並評估 119 / 緊急醫療升級。";
  if (replyState?.replyCode === 4) return "患者無法起身，請維持 critical 並確認居服員到場。";
  if (replyState?.replyCode === 1 && score <= 60) return "患者回覆安全，改為 acknowledged 並保留追蹤紀錄。";
  if (replyState?.noResponseTimeout) return "30 秒內未收到確認，升級通知家屬與居服員，必要時展示 119 流程。";
  if (score >= 90) return "Critical：先語音確認，同步通知家屬與居服員，必要時升級 119 展示流程。";
  if (score >= 60) return "Warning：要求患者低資料量回覆，並由照護端人工複核。";
  if (score >= 30) return "Watch：發送確認訊息並持續觀察返家恢復趨勢。";
  if (patientStatus.signalQuality === "offline") return "Stable / Offline：資料品質不足，先補送封包或人工確認，不自動啟動 119 流程。";
  return "Stable：保留紀錄並回到例行監測。";
}

export function calculateRiskScore(
  patientStatus: PatientStatus,
  helpEvent: OperationsHelpEvent,
  replyState?: ReplyState
): RiskAssessment {
  let physiologicalRisk = 0;
  let activityRisk = 0;
  let helpEventRisk = 0;
  let communicationRisk = 0;
  const reasons: string[] = [];

  if (helpEvent.active) {
    helpEventRisk += 35;
    reasons.push("求助事件已啟動，直接進入照護確認流程（+35）");
  }

  if (patientStatus.spo2 < 88) {
    physiologicalRisk += 45;
    reasons.push(`SpO2 下降至 ${patientStatus.spo2}%，提高生理風險（+45）`);
  } else if (patientStatus.spo2 < 92) {
    physiologicalRisk += 30;
    reasons.push(`SpO2 低於 92%，目前 ${patientStatus.spo2}%（+30）`);
  }

  if (patientStatus.hr > 120 || patientStatus.hr < 50) {
    physiologicalRisk += 25;
    reasons.push(`心率 ${patientStatus.hr} bpm 超出安全範圍（+25）`);
  }

  if (patientStatus.activityDropPercent > 60) {
    activityRisk += 20;
    reasons.push(`活動量下降 ${patientStatus.activityDropPercent}%，返家恢復趨勢需關注（+20）`);
  }

  if (patientStatus.signalQuality === "weak" || patientStatus.signalQuality === "offline") {
    communicationRisk += 10;
    reasons.push(`訊號品質為 ${patientStatus.signalQuality}，資料可靠度降低（+10）`);
  }

  if (patientStatus.packetDelaySeconds > 10) {
    communicationRisk += 8;
    reasons.push(`封包延遲 ${patientStatus.packetDelaySeconds} 秒，需啟動補送監控（+8）`);
  }

  if (replyState?.noResponseTimeout) {
    helpEventRisk += 20;
    reasons.push("30 秒內未收到確認，升級通知家屬與居服員（+20）");
  }

  if (helpEvent.active && helpEvent.source === "bedside_button" && patientStatus.spo2 < 92) {
    helpEventRisk += 25;
    reasons.push("床邊呼叫器與低血氧同時發生，視為 Critical 複合事件（+25）");
  }

  if ((patientStatus.signalQuality === "weak" || patientStatus.signalQuality === "offline") && patientStatus.bufferedPacketCount > 0) {
    reasons.push("弱訊號且有暫存封包：啟動低丟包備援策略，但不把通訊問題視為生理惡化");
  }

  if (replyState?.replyCode === 1) {
    helpEventRisk -= 30;
    reasons.push("患者回覆安全，降低求助事件風險（-30）");
  } else if (replyState?.replyCode === 2) {
    helpEventRisk += 10;
    reasons.push("患者回覆不舒服但可說話，維持照護端確認（+10）");
  } else if (replyState?.replyCode === 3) {
    helpEventRisk += 25;
    reasons.push("患者表示需要協助，建議派工（+25）");
  } else if (replyState?.replyCode === 4) {
    helpEventRisk += 40;
    reasons.push("患者表示無法起身，維持 Critical 並確認到場（+40）");
  } else if (replyState?.replyCode === 5) {
    helpEventRisk += 50;
    reasons.push("患者要求立即派人，進入緊急升級展示流程（+50）");
  }

  const score = physiologicalRisk + activityRisk + helpEventRisk + communicationRisk;
  const riskScore = clampScore(score);
  const riskLevel = mapOperationRiskLevel(riskScore);
  const emergencyTransportRequired =
    riskScore >= 90 ||
    (helpEvent.active && helpEvent.source === "bedside_button") ||
    patientStatus.bedsideButtonStatus === "pressed";
  const communicationStrategy =
    patientStatus.signalQuality === "offline"
      ? "先寫入本地 buffer；恢復連線後保留 eventId 補送"
    : patientStatus.signalQuality === "weak" || patientStatus.packetDelaySeconds > 10
        ? emergencyTransportRequired
          ? "Critical helpEvent 優先傳送；ack timeout 後切換備援路徑"
          : "弱訊號 telemetry 需補送與人工確認；119 流程維持 standby"
        : "一般 telemetry 與 helpEvent 分流傳送，求助封包不可被覆蓋";

  return {
    riskScore,
    riskLevel,
    reasons: reasons.length ? reasons : ["未觸發加分規則"],
    matrix: {
      physiologicalRisk,
      activityRisk,
      helpEventRisk,
      communicationRisk,
      totalScore: riskScore,
      level: riskLevel
    },
    communicationStrategy,
    recommendedAction: recommendedActionFor(riskScore, patientStatus, replyState),
    updatedAt: nowIso()
  };
}

function priorityFor(level: OperationRiskLevel): AlertCase["priority"] {
  if (level === "critical") return "urgent";
  if (level === "warning") return "high";
  return "normal";
}

const defaultActionStatuses: CaseActionStatuses = {
  callPatient: "idle",
  patientCheckPrompt: "idle",
  notifyFamily: "idle",
  workerDispatch: "idle",
  emergencyEscalation: "idle",
  timeout: "idle"
};

function mergeActionStatuses(alertCase: Partial<Pick<AlertCase, "workflow">>, overrides?: Partial<CaseActionStatuses>): CaseActionStatuses {
  return {
    ...defaultActionStatuses,
    ...(alertCase.workflow?.actionStatuses ?? {}),
    ...(overrides ?? {})
  };
}

export function hasCriticalEscalationTrigger(
  alertCase: Pick<AlertCase, "riskScore" | "helpEvent" | "patientStatus">
) {
  return (
    alertCase.riskScore >= 90 ||
    (alertCase.helpEvent.active && alertCase.helpEvent.source === "bedside_button") ||
    alertCase.patientStatus.bedsideButtonStatus === "pressed"
  );
}

function statusFromAction(actionStatus: CaseActionStatuses[keyof CaseActionStatuses]): EmergencyFlowStatus {
  if (actionStatus === "retrying" || actionStatus === "timeout") return "retrying";
  if (actionStatus === "sent" || actionStatus === "departed") return "sent";
  if (actionStatus === "confirmed" || actionStatus === "connected" || actionStatus === "arrived") return "confirmed";
  if (actionStatus === "resolved") return "resolved";
  return "pending";
}

function packetEmergencyStatus(packet: AlertCase["lowDataPacket"], emergencyFlowActive: boolean): EmergencyFlowStatus {
  if (!emergencyFlowActive) return "pending";
  if (!packet) return "active";
  if (packet.deliveryStatus === "failed" || packet.acknowledgementStatus === "failed") return "failed";
  if (packet.deliveryStatus === "retrying" || packet.acknowledgementStatus === "retrying") return "retrying";
  if (packet.acknowledgementStatus === "acknowledged" || packet.deliveryStatus === "acknowledged" || packet.deliveryStatus === "delivered") {
    return "confirmed";
  }
  if (packet.deliveryStatus === "sent" || packet.acknowledgementStatus === "sent" || packet.acknowledgementStatus === "pending") return "sent";
  return "active";
}

function consoleAckStatus(packet: AlertCase["lowDataPacket"], emergencyFlowActive: boolean): EmergencyFlowStatus {
  if (!emergencyFlowActive) return "pending";
  if (!packet) return "active";
  if (packet.acknowledgementStatus === "failed") return "failed";
  if (packet.acknowledgementStatus === "retrying") return "retrying";
  return "confirmed";
}

function caseWritebackStatus(state: CareDemoState): EmergencyFlowStatus {
  if (state === "resolved") return "resolved";
  if (state === "responderArrived") return "confirmed";
  if (state === "waitingResponder") return "sent";
  if (state === "emergencyEscalated") return "active";
  return "pending";
}

export function buildEmergencyEscalationFlow(alertCase: AlertCase): EmergencyFlowNode[] {
  const isCritical = hasCriticalEscalationTrigger(alertCase);
  const manualEscalated = Boolean(alertCase.workflow && alertCase.workflow.actionStatuses.emergencyEscalation !== "idle");
  const triggerAccepted = isCritical || manualEscalated;
  const packet = alertCase.lowDataPacket;
  const statuses = mergeActionStatuses(alertCase);
  const workerDispatch = alertCase.workflow?.workerDispatch ?? { status: "idle" as const };
  const emergency119Status =
    alertCase.workflowState === "resolved"
      ? "resolved"
      : ["waitingResponder", "responderArrived"].includes(alertCase.workflowState)
        ? "confirmed"
        : alertCase.workflowState === "emergencyEscalated"
          ? "active"
          : statusFromAction(statuses.emergencyEscalation);
  const dispatchStatus =
    workerDispatch.status === "arrived"
      ? "confirmed"
      : workerDispatch.status === "departed"
        ? "active"
        : workerDispatch.status === "assigned"
          ? "sent"
          : statusFromAction(statuses.workerDispatch);

  return [
    {
      id: "criticalDetected",
      label: triggerAccepted ? "Emergency 條件成立" : "119 流程待命",
      detail: isCritical ? "已由風險矩陣觸發" : manualEscalated ? "照護端手動升級觸發" : "尚未達 Critical 展示條件",
      status: triggerAccepted ? "confirmed" : "pending",
      meta: [
        { label: "condition", value: "riskScore >= 90 / 床邊 SOS / 手動升級" },
        { label: "riskScore", value: String(alertCase.riskScore) }
      ]
    },
    {
      id: "priorityPacket",
      label: "優先封包送出",
      detail:
        alertCase.patientStatus.signalQuality === "weak" || alertCase.patientStatus.signalQuality === "offline"
          ? "signal weak：LTE fallback / retry queue"
          : "Critical helpEvent 優先傳送",
      status: packetEmergencyStatus(packet, triggerAccepted),
      meta: [
        { label: "packet id", value: packet?.packetId ?? "not generated" },
        { label: "payload", value: packet ? `${packet.payloadSizeKb.toFixed(1)} KB` : "pending" },
        { label: "path", value: packet?.connectionPath ?? alertCase.patientStatus.connectionPath },
        { label: "retry", value: String(packet?.retryCount ?? alertCase.patientStatus.bufferedPacketCount) }
      ]
    },
    {
      id: "consoleAck",
      label: "照護端接收",
      detail: "care console 已收到事件",
      status: consoleAckStatus(packet, triggerAccepted),
      meta: [
        { label: "ack latency", value: `${Math.max(1.2, Math.min(2.8, alertCase.patientStatus.packetDelaySeconds / 7)).toFixed(1)}s` },
        { label: "ack", value: packet?.acknowledgementStatus ?? alertCase.patientStatus.acknowledgementStatus }
      ]
    },
    {
      id: "familyNotify",
      label: "家屬 / 居服員同步通知",
      detail:
        statuses.notifyFamily === "retrying"
          ? "app push 失敗，電話 / 簡訊 / 低頻文字通道 retrying"
          : "app push、電話、簡訊與低頻文字通道準備同步",
      status: statusFromAction(statuses.notifyFamily),
      meta: [
        { label: "family", value: statuses.notifyFamily },
        { label: "worker", value: statuses.workerDispatch }
      ]
    },
    {
      id: "emergency119",
      label: "119 展示流程啟動",
      detail: "整理 location confidence、GPS / indoor hint、患者基本狀態摘要",
      status: emergency119Status,
      meta: [
        { label: "location", value: alertCase.patientStatus.locationStatus },
        { label: "summary", value: `HR ${alertCase.patientStatus.hr}, SpO2 ${alertCase.patientStatus.spo2}%, ${alertCase.patientStatus.motionState}` }
      ]
    },
    {
      id: "responderDispatch",
      label: "現場人員派遣 / 等待到場",
      detail: "assigned worker、distance 與 ETA 持續回寫",
      status: dispatchStatus,
      meta: [
        { label: "assigned worker", value: workerDispatch.workerId ?? alertCase.assignedCareWorkerId ?? "pending" },
        { label: "distance", value: workerDispatch.distanceKm ? `${workerDispatch.distanceKm.toFixed(1)} km` : "pending" },
        { label: "ETA", value: workerDispatch.etaMinutes ? `${workerDispatch.etaMinutes} min` : "pending" }
      ]
    },
    {
      id: "caseWriteback",
      label: "案件回寫",
      detail: "workflowState：emergencyEscalated → waitingResponder → responderArrived → resolved",
      status: caseWritebackStatus(alertCase.workflowState),
      meta: [
        { label: "current", value: alertCase.workflowState },
        { label: "case", value: alertCase.status }
      ]
    }
  ];
}

function syncCaseWorkflow(
  alertCase: AlertCase,
  options: {
    state?: CareDemoState;
    escalationFlowVisible?: boolean;
    actionStatuses?: Partial<CaseActionStatuses>;
    workerDispatch?: Partial<AlertCase["workflow"]["workerDispatch"]>;
  } = {}
): AlertCase {
  const state = options.state ?? determineWorkflowState(alertCase);
  const escalationFlowVisible = options.escalationFlowVisible ?? Boolean(alertCase.workflow?.escalationFlowVisible || hasCriticalEscalationTrigger(alertCase));
  const actionStatuses = mergeActionStatuses(alertCase, options.actionStatuses);
  const workerDispatch = {
    status: "idle" as const,
    ...(alertCase.workflow?.workerDispatch ?? {}),
    ...(options.workerDispatch ?? {})
  };
  const workflowBase = {
    state,
    escalationFlowVisible,
    escalationFlow: [] as EmergencyFlowNode[],
    assignedWorkerId: alertCase.assignedCareWorkerId ?? alertCase.workflow?.assignedWorkerId,
    workerDispatch,
    actionStatuses,
    eventLog: alertCase.timeline
  };
  const syncedCase: AlertCase = {
    ...alertCase,
    workflowState: state,
    workflow: workflowBase
  };

  return {
    ...syncedCase,
    workflow: {
      ...workflowBase,
      escalationFlow: buildEmergencyEscalationFlow(syncedCase)
    }
  };
}

export function refreshCaseWorkflow(alertCase: AlertCase): AlertCase {
  return syncCaseWorkflow(alertCase);
}

export function determineWorkflowState(
  alertCase: Pick<AlertCase, "status" | "riskLevel" | "riskScore" | "helpEvent" | "patientStatus" | "assignedCareWorkerId"> & Partial<Pick<AlertCase, "workflow">>
): CareDemoState {
  if (alertCase.status === "resolved") return "resolved";
  if (alertCase.status === "arrived") return "responderArrived";
  if (alertCase.status === "on_the_way" || alertCase.workflow?.workerDispatch.status === "departed") return "waitingResponder";
  if (alertCase.status === "no_response" || alertCase.workflow?.actionStatuses.timeout === "timeout") return "emergencyEscalated";
  if (
    hasCriticalEscalationTrigger(alertCase) ||
    Boolean(alertCase.workflow && alertCase.workflow.actionStatuses.emergencyEscalation !== "idle")
  ) {
    return "emergencyEscalated";
  }
  if (alertCase.assignedCareWorkerId || alertCase.patientStatus.careWorkerDispatched || alertCase.patientStatus.familyNotified) return "notifyCareWorker";
  if (alertCase.status === "contacting" || alertCase.patientStatus.acknowledgementStatus === "sent" || alertCase.riskLevel === "warning") return "confirmPatient";
  if (alertCase.riskLevel === "watch") return "riskDetected";
  return "normalMonitoring";
}

export function appendAuditLog(alertCase: AlertCase, event: Omit<AuditLogEntry, "id" | "timestamp">): AlertCase {
  const entry: AuditLogEntry = {
    id: `${alertCase.eventId}-${alertCase.timeline.length + 1}`,
    timestamp: nowIso(),
    ...event
  };
  const timeline = [...alertCase.timeline, entry];

  return syncCaseWorkflow({
    ...alertCase,
    updatedAt: entry.timestamp,
    timeline
  });
}

export function createAlertCase(patientStatus: PatientStatus, riskAssessment: RiskAssessment, helpEvent: OperationsHelpEvent): AlertCase {
  const eventId = `evt-${patientStatus.patientId}-${helpEvent.createdAt.replace(/\D/g, "").slice(-6)}`;
  const alertCase: AlertCase = {
    eventId,
    patientId: patientStatus.patientId,
    source: helpEvent.source,
    riskScore: riskAssessment.riskScore,
    riskLevel: riskAssessment.riskLevel,
    status: "pending",
    priority: priorityFor(riskAssessment.riskLevel),
    createdAt: helpEvent.createdAt,
    updatedAt: riskAssessment.updatedAt,
    patientStatus,
    helpEvent,
    riskAssessment,
    timeline: [],
    slaSecondsRemaining: riskAssessment.riskLevel === "critical" ? 240 : 900,
    workflowState: "normalMonitoring",
    workflow: {
      state: "normalMonitoring",
      escalationFlowVisible: false,
      escalationFlow: [],
      workerDispatch: { status: "idle" },
      actionStatuses: { ...defaultActionStatuses },
      eventLog: []
    }
  };

  let nextCase = appendAuditLog(syncCaseWorkflow(alertCase), {
    source: "system",
    event: "system_created_alert",
    decision: `alertQueue created with riskScore = ${riskAssessment.riskScore}`,
    actor: "risk-engine",
    statusChange: "pending"
  });

  if (hasCriticalEscalationTrigger(nextCase)) {
    nextCase = appendAuditLog(nextCase, {
      source: "system",
      event: "critical_risk_detected",
      decision: "Critical risk detected by matrix trigger",
      actor: "risk-engine",
      statusChange: `riskLevel -> ${riskAssessment.riskLevel}`
    });
    nextCase = appendAuditLog(nextCase, {
      source: "device",
      event: "help_event_packet_prioritized",
      decision: "Help event packet prioritized for low-data emergency delivery",
      actor: "packet-router",
      statusChange: "packet -> sent"
    });
    nextCase = appendAuditLog(nextCase, {
      source: "system",
      event: "care_console_acknowledged",
      decision: "Care console acknowledged critical event and prepared escalation summary",
      actor: "care-console",
      statusChange: `${nextCase.workflowState}`
    });
  }

  return nextCase;
}

export function assignCareWorker(alertCase: AlertCase, careWorkers: CareWorker[]) {
  const rankedWorkers = careWorkers
    .filter((worker) => worker.status === "available")
    .sort((a, b) => a.distanceKm + a.currentLoad * 1.2 - (b.distanceKm + b.currentLoad * 1.2));
  const selectedWorker = rankedWorkers[0] ?? careWorkers.slice().sort((a, b) => a.currentLoad - b.currentLoad)[0];

  if (!selectedWorker) {
    return { alertCase, careWorkers };
  }

  const assignedCase: AlertCase = {
    ...alertCase,
    status: "assigned",
    assignedCareWorkerId: selectedWorker.workerId,
    patientStatus: {
      ...alertCase.patientStatus,
      careWorkerDispatched: true
    },
    workflow: {
      ...alertCase.workflow,
      assignedWorkerId: selectedWorker.workerId,
      workerDispatch: {
        status: "assigned",
        workerId: selectedWorker.workerId,
        assignedAt: nowIso(),
        distanceKm: selectedWorker.distanceKm,
        etaMinutes: Math.max(4, Math.round(selectedWorker.distanceKm * 6 + selectedWorker.currentLoad * 2))
      },
      actionStatuses: {
        ...alertCase.workflow.actionStatuses,
        workerDispatch: "confirmed"
      }
    }
  };

  const nextAlert = appendAuditLog(
    syncCaseWorkflow(assignedCase),
    {
      source: "system",
      event: "worker_assigned",
      decision: `${selectedWorker.name} selected by distance ${selectedWorker.distanceKm.toFixed(1)}km and load ${selectedWorker.currentLoad}`,
      actor: "dispatch-engine",
      statusChange: `${alertCase.status} -> assigned`
    }
  );

  return {
    alertCase: nextAlert,
    careWorkers: careWorkers.map((worker) =>
      worker.workerId === selectedWorker.workerId
        ? {
            ...worker,
            status: "busy" as const,
            currentLoad: worker.currentLoad + 1,
            assignedPatientIds: Array.from(new Set([...worker.assignedPatientIds, alertCase.patientId]))
          }
        : worker
    )
  };
}

export function applyPatientReply(alertCase: AlertCase, replyCode: 1 | 2 | 3 | 4 | 5): AlertCase {
  const nextRisk = calculateRiskScore(alertCase.patientStatus, alertCase.helpEvent, { replyCode });
  const nextStatus: AlertStatus =
    replyCode === 1 ? "acknowledged" : replyCode === 2 ? "contacting" : replyCode === 3 ? "assigned" : "assigned";
  const nextAcknowledgement: PatientStatus["acknowledgementStatus"] = replyCode === 1 ? "acknowledged" : "sent";

  const nextCase: AlertCase = {
    ...alertCase,
    riskScore: nextRisk.riskScore,
    riskLevel: nextRisk.riskLevel,
    priority: priorityFor(nextRisk.riskLevel),
    riskAssessment: nextRisk,
    status: nextStatus,
    patientStatus: {
      ...alertCase.patientStatus,
      acknowledgementStatus: nextAcknowledgement
    },
    workflow: {
      ...alertCase.workflow,
      actionStatuses: {
        ...alertCase.workflow.actionStatuses,
        patientCheckPrompt: replyCode === 1 ? "confirmed" : "sent",
        callPatient: replyCode === 1 ? "connected" : alertCase.workflow.actionStatuses.callPatient
      }
    }
  };

  return appendAuditLog(
    syncCaseWorkflow(nextCase, {
      escalationFlowVisible: replyCode >= 4 ? true : alertCase.workflow.escalationFlowVisible
    }),
    {
      source: "patient",
      event: "patient_replied",
      decision: `replyCode ${replyCode} applied, riskScore updated to ${nextRisk.riskScore}`,
      actor: "low-data-reply",
      statusChange: `${alertCase.status} -> ${nextStatus}`
    }
  );
}

export function advanceCareWorkflow(alertCase: AlertCase, actionType: CareWorkflowAction): AlertCase {
  let nextStatus: AlertStatus = alertCase.status;
  let nextRisk = alertCase.riskAssessment;
  let nextPatient: PatientStatus = { ...alertCase.patientStatus };
  let nextHelpEvent = { ...alertCase.helpEvent };
  const actionStatuses: CaseActionStatuses = { ...alertCase.workflow.actionStatuses };
  const workerDispatch = { ...alertCase.workflow.workerDispatch };
  let stateOverride: CareDemoState | undefined;
  let escalationFlowVisible = alertCase.workflow.escalationFlowVisible;
  let decision = "manual operation recorded";
  let actor = "care-coordinator";
  let source: AuditLogEntry["source"] = "care_worker";

  if (actionType === "contactPatient") {
    nextStatus = "contacting";
    actionStatuses.callPatient =
      actionStatuses.callPatient === "calling" ? "no_answer" : actionStatuses.callPatient === "no_answer" ? "connected" : "calling";
    nextPatient.acknowledgementStatus = actionStatuses.callPatient === "connected" ? "acknowledged" : "sent";
    decision = `patient call attempt status = ${actionStatuses.callPatient}`;
  } else if (actionType === "sendLowDataConfirmation") {
    nextStatus = "contacting";
    actionStatuses.patientCheckPrompt = nextPatient.signalQuality === "offline" ? "retrying" : "sent";
    nextPatient.acknowledgementStatus = actionStatuses.patientCheckPrompt === "retrying" ? "retrying" : "sent";
    decision = `low-data safety confirmation ${actionStatuses.patientCheckPrompt}`;
    actor = "communication-adapter";
    source = "system";
  } else if (actionType === "notifyFamily") {
    actionStatuses.notifyFamily = nextPatient.signalQuality === "weak" || nextPatient.signalQuality === "offline" ? "retrying" : "sent";
    nextPatient.familyNotified = actionStatuses.notifyFamily === "sent";
    decision = `family notification ${actionStatuses.notifyFamily}`;
  } else if (actionType === "escalateEmergency") {
    nextStatus = "assigned";
    actionStatuses.emergencyEscalation = "sent";
    escalationFlowVisible = true;
    stateOverride = "emergencyEscalated";
    decision = "119 escalation summary prepared with location, vitals and packet context";
  } else if (actionType === "markOnTheWay") {
    nextStatus = "on_the_way";
    actionStatuses.workerDispatch = "departed";
    workerDispatch.status = "departed";
    workerDispatch.departedAt = nowIso();
    nextPatient.careWorkerDispatched = true;
    stateOverride = "waitingResponder";
    decision = "responder marked as departed";
  } else if (actionType === "markArrived") {
    nextStatus = "arrived";
    actionStatuses.workerDispatch = "arrived";
    workerDispatch.status = "arrived";
    workerDispatch.arrivedAt = nowIso();
    nextPatient.careWorkerDispatched = true;
    stateOverride = "responderArrived";
    decision = "responder arrived and patient status is being confirmed";
  } else if (actionType === "resolveCase") {
    nextStatus = "resolved";
    nextRisk = {
      ...alertCase.riskAssessment,
      riskScore: Math.min(alertCase.riskScore, 24),
      riskLevel: "stable",
      reasons: ["事件已解除，保留完整 audit trail 並回到例行監測"],
      matrix: {
        ...alertCase.riskAssessment.matrix,
        totalScore: Math.min(alertCase.riskScore, 24),
        level: "stable"
      },
      communicationStrategy: "事件解除後停止 retry，保留封包與決策紀錄",
      recommendedAction: "Resolved：事件解除，回到例行監測並安排後續追蹤。",
      updatedAt: nowIso()
    };
    actionStatuses.emergencyEscalation = "resolved";
    actionStatuses.workerDispatch = actionStatuses.workerDispatch === "idle" ? "resolved" : actionStatuses.workerDispatch;
    nextPatient.acknowledgementStatus = "acknowledged";
    nextHelpEvent = {
      ...nextHelpEvent,
      active: false,
      resolvedAt: nowIso()
    };
    stateOverride = "resolved";
    escalationFlowVisible = true;
    decision = "case resolved and riskScore closed down";
  } else if (actionType === "noResponseTimeout") {
    nextStatus = "no_response";
    nextRisk = calculateRiskScore(nextPatient, nextHelpEvent, { noResponseTimeout: true });
    actionStatuses.timeout = "timeout";
    actionStatuses.patientCheckPrompt = "retrying";
    actionStatuses.notifyFamily = nextPatient.signalQuality === "good" ? "sent" : "retrying";
    actionStatuses.emergencyEscalation = "sent";
    nextPatient.acknowledgementStatus = "retrying";
    nextPatient.familyNotified = actionStatuses.notifyFamily === "sent";
    stateOverride = "emergencyEscalated";
    escalationFlowVisible = true;
    source = "system";
    actor = "communication-adapter";
    decision = `no response timeout, riskScore updated to ${nextRisk.riskScore}`;
  } else if (actionType === "assignCareWorker") {
    nextStatus = "assigned";
    actionStatuses.workerDispatch = "confirmed";
  }

  const nextCase = syncCaseWorkflow(
    {
      ...alertCase,
      status: nextStatus,
      riskScore: nextRisk.riskScore,
      riskLevel: nextRisk.riskLevel,
      priority: priorityFor(nextRisk.riskLevel),
      riskAssessment: nextRisk,
      patientStatus: nextPatient,
      helpEvent: nextHelpEvent,
      workflow: {
        ...alertCase.workflow,
        actionStatuses,
        workerDispatch
      }
    },
    {
      state: stateOverride,
      escalationFlowVisible,
      actionStatuses,
      workerDispatch
    }
  );

  let loggedCase = appendAuditLog(nextCase, {
    source,
    event: actionType,
    decision,
    actor,
    statusChange: `${alertCase.status} -> ${nextStatus}`
  });

  if (actionType === "escalateEmergency") {
    loggedCase = appendAuditLog(loggedCase, {
      source: "system",
      event: "emergency_119_summary_prepared",
      decision: "119 escalation summary prepared for dispatcher handoff",
      actor: "care-console",
      statusChange: "workflowState -> emergencyEscalated"
    });
  }

  return loggedCase;
}

function numberFromPayload(payload: Record<string, unknown>, key: string, fallback: number) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringFromPayload(payload: Record<string, unknown>, key: string, fallback: string) {
  const value = payload[key];
  return typeof value === "string" && value.length ? value : fallback;
}

export function simulateWeakNetworkPacket(payload: Record<string, unknown>): WeakNetworkPacket {
  const text = JSON.stringify(payload);
  const packetSizeKb = Math.max(0.2, Number((text.length / 1024).toFixed(1)));
  const type = String(payload.type ?? "ACK_REPLY");
  const patientId = String(payload.patientId ?? "unknown");
  const eventId = stringFromPayload(payload, "eventId", `evt-${patientId}-${Date.now().toString().slice(-6)}`);
  const connectionPath = stringFromPayload(payload, "connectionPath", "BLE -> phone relay") as WeakNetworkPacket["connectionPath"];
  const retryCount = numberFromPayload(payload, "retryCount", connectionPath === "LTE fallback" ? 1 : 0);
  const bufferedPacketCount = numberFromPayload(payload, "bufferedPacketCount", connectionPath === "buffered offline" ? 3 : 0);
  const priority: WeakNetworkPacket["priority"] = type.includes("HELP") || Boolean(payload.helpEventActive) ? "critical" : "normal";
  const acknowledgementStatus =
    stringFromPayload(
      payload,
      "acknowledgementStatus",
      bufferedPacketCount > 0 ? "retrying" : priority === "critical" ? "pending" : "sent"
    ) as WeakNetworkPacket["acknowledgementStatus"];
  const deliveryStatus: DeliveryStatus =
    acknowledgementStatus === "acknowledged"
      ? "acknowledged"
      : acknowledgementStatus === "failed"
        ? "failed"
        : acknowledgementStatus === "retrying" || bufferedPacketCount > 0
          ? "retrying"
          : packetSizeKb <= 1.6
            ? "sent"
            : "delayed";
  const timestamp = nowIso();

  return {
    packetId: stringFromPayload(payload, "packetId", `pkt-${patientId}-${timestamp.replace(/\D/g, "").slice(-8)}`),
    eventId,
    type,
    patientId,
    replyCode: typeof payload.replyCode === "number" ? payload.replyCode : undefined,
    packetSizeKb,
    payloadSizeKb: packetSizeKb,
    networkMode: connectionPath === "LTE fallback" || connectionPath === "buffered offline" ? "fallback" : "weak",
    connectionPath,
    retryCount,
    bufferedPacketCount,
    acknowledgementStatus,
    priority,
    deliveryStatus,
    timestamp,
    lastSyncTime: stringFromPayload(payload, "lastSyncTime", timestamp),
    payload
  };
}

export function attachLowDataPacket(alertCase: AlertCase, packet: WeakNetworkPacket): AlertCase {
  const nextCase = {
    ...alertCase,
    status: "contacting" as const,
    lowDataPacket: packet,
    patientStatus: {
      ...alertCase.patientStatus,
      acknowledgementStatus: packet.acknowledgementStatus,
      connectionPath: packet.connectionPath,
      bufferedPacketCount: packet.bufferedPacketCount,
      packetDelaySeconds: packet.deliveryStatus === "retrying" ? Math.max(alertCase.patientStatus.packetDelaySeconds, 12) : alertCase.patientStatus.packetDelaySeconds
    },
    workflow: {
      ...alertCase.workflow,
      actionStatuses: {
        ...alertCase.workflow.actionStatuses,
        patientCheckPrompt: packet.deliveryStatus === "retrying" ? "retrying" : "sent"
      }
    }
  };

  return appendAuditLog(
    syncCaseWorkflow(nextCase),
    {
      source: "system",
      event: "patient_contacted",
      decision: `packet ${packet.packetId} ${packet.payloadSizeKb.toFixed(1)}KB via ${packet.connectionPath}, ack=${packet.acknowledgementStatus}`,
      actor: "communication-adapter",
      statusChange: `${alertCase.status} -> contacting`
    }
  );
}

export function generateCareEvent(alertCase: AlertCase, kind?: GeneratedCareEventKind): AlertCase {
  const eventKinds: GeneratedCareEventKind[] = [
    "spo2_drop",
    "hr_abnormal",
    "activity_drop",
    "bedside_pressed",
    "signal_poor",
    "packet_delay",
    "no_response",
    "patient_safe",
    "worker_arrived"
  ];
  const selectedKind = kind ?? eventKinds[Math.floor(Math.random() * eventKinds.length)];
  let nextStatus: AlertStatus = alertCase.status;
  let nextHelpEvent = alertCase.helpEvent;
  let replyState: ReplyState | undefined;
  let event = selectedKind;
  let decision = "";

  let nextPatient: PatientStatus = {
    ...alertCase.patientStatus
  };

  if (selectedKind === "spo2_drop") {
    nextPatient = { ...nextPatient, spo2: Math.min(nextPatient.spo2, 88), lastSyncTime: nowIso() };
    event = "spo2_drop";
    decision = "SpO2 下降事件已寫入 telemetry，重新計算 physiological risk";
  } else if (selectedKind === "hr_abnormal") {
    nextPatient = { ...nextPatient, hr: Math.max(nextPatient.hr, 124), lastSyncTime: nowIso() };
    decision = "心率異常事件已寫入 telemetry";
  } else if (selectedKind === "activity_drop") {
    nextPatient = { ...nextPatient, activityDropPercent: Math.max(nextPatient.activityDropPercent, 68), motionState: "low_motion" };
    decision = "活動量突然下降，activity risk 加權";
  } else if (selectedKind === "bedside_pressed") {
    nextHelpEvent = { active: true, source: "bedside_button", createdAt: nowIso() };
    nextPatient = { ...nextPatient, bedsideButtonStatus: "pressed", acknowledgementStatus: "pending" };
    nextStatus = "pending";
    decision = "床邊呼叫器已按下，helpEvent 封包不可被一般 telemetry 覆蓋";
  } else if (selectedKind === "signal_poor") {
    nextPatient = { ...nextPatient, signalQuality: "weak", dataQuality: "partial", connectionPath: "LTE fallback" };
    decision = "訊號品質變差，切換備援傳輸路徑";
  } else if (selectedKind === "packet_delay") {
    nextPatient = {
      ...nextPatient,
      signalQuality: "weak",
      dataQuality: "partial",
      packetDelaySeconds: Math.max(nextPatient.packetDelaySeconds, 13),
      bufferedPacketCount: nextPatient.bufferedPacketCount + 2,
      connectionPath: "buffered offline",
      acknowledgementStatus: "retrying"
    };
    decision = "封包延遲與暫存增加，保留 eventId 並等待 ack 後停止 retry";
  } else if (selectedKind === "no_response") {
    replyState = { noResponseTimeout: true };
    nextPatient = { ...nextPatient, acknowledgementStatus: "retrying" };
    nextStatus = "no_response";
    decision = "30 秒內無回覆，進入升級流程";
  } else if (selectedKind === "patient_safe") {
    replyState = { replyCode: 1 };
    nextPatient = { ...nextPatient, acknowledgementStatus: "acknowledged" };
    nextStatus = "acknowledged";
    decision = "患者確認安全，降低求助事件風險";
  } else {
    nextPatient = { ...nextPatient, careWorkerDispatched: true };
    nextStatus = "arrived";
    decision = "居服員到達，事件進入現場確認";
  }

  const nextRisk = calculateRiskScore(nextPatient, nextHelpEvent, replyState);
  const nextPacket = simulateWeakNetworkPacket({
    type: nextHelpEvent.active ? "HELP_EVENT" : "TELEMETRY_EVENT",
    eventId: alertCase.eventId,
    patientId: alertCase.patientId,
    helpEventActive: nextHelpEvent.active,
    connectionPath: nextPatient.connectionPath,
    retryCount: nextPatient.connectionPath === "LTE fallback" ? 1 : nextPatient.connectionPath === "buffered offline" ? 3 : 0,
    bufferedPacketCount: nextPatient.bufferedPacketCount,
    acknowledgementStatus: nextPatient.acknowledgementStatus,
    lastSyncTime: nextPatient.lastSyncTime
  });
  const actionStatuses: CaseActionStatuses = { ...alertCase.workflow.actionStatuses };
  const workerDispatch = { ...alertCase.workflow.workerDispatch };
  let stateOverride: CareDemoState | undefined;
  let escalationFlowVisible = alertCase.workflow.escalationFlowVisible;

  if (selectedKind === "no_response") {
    actionStatuses.timeout = "timeout";
    actionStatuses.patientCheckPrompt = "retrying";
    actionStatuses.notifyFamily = nextPatient.signalQuality === "good" ? "sent" : "retrying";
    actionStatuses.emergencyEscalation = "sent";
    stateOverride = "emergencyEscalated";
    escalationFlowVisible = true;
  } else if (selectedKind === "worker_arrived") {
    actionStatuses.workerDispatch = "arrived";
    workerDispatch.status = "arrived";
    workerDispatch.arrivedAt = nowIso();
    stateOverride = "responderArrived";
    escalationFlowVisible = true;
  } else if (selectedKind === "patient_safe") {
    actionStatuses.patientCheckPrompt = "confirmed";
  } else if (selectedKind === "bedside_pressed") {
    escalationFlowVisible = true;
  } else if (["spo2_drop", "activity_drop", "packet_delay"].includes(selectedKind)) {
    escalationFlowVisible =
      nextRisk.riskScore >= 90 ||
      (nextHelpEvent.active && nextHelpEvent.source === "bedside_button") ||
      nextPatient.bedsideButtonStatus === "pressed";
  }

  const nextCase = {
    ...alertCase,
    status: nextStatus,
    riskScore: nextRisk.riskScore,
    riskLevel: nextRisk.riskLevel,
    priority: priorityFor(nextRisk.riskLevel),
    patientStatus: nextPatient,
    helpEvent: nextHelpEvent,
    riskAssessment: nextRisk,
    lowDataPacket: nextPacket,
    workflow: {
      ...alertCase.workflow,
      actionStatuses,
      workerDispatch
    }
  };

  return appendAuditLog(
    syncCaseWorkflow(nextCase, { state: stateOverride, escalationFlowVisible, actionStatuses, workerDispatch }),
    {
      source: selectedKind === "patient_safe" ? "patient" : selectedKind === "worker_arrived" ? "care_worker" : "system",
      event,
      decision,
      actor: selectedKind === "worker_arrived" ? "field-worker" : "demo-event-generator",
      statusChange: `${alertCase.status} -> ${nextStatus}`
    }
  );
}
