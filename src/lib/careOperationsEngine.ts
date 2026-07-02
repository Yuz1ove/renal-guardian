import type {
  AlertCase,
  AlertStatus,
  CareDemoState,
  AuditLogEntry,
  CareWorkflowAction,
  CareWorker,
  DeliveryStatus,
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

function recommendedActionFor(score: number, replyState?: ReplyState) {
  if (replyState?.replyCode === 5) return "患者請求立即派人，建議同步守望隊並評估 119 / 緊急醫療升級。";
  if (replyState?.replyCode === 4) return "患者無法起身，請維持 critical 並確認居服員到場。";
  if (replyState?.replyCode === 1 && score <= 60) return "患者回覆安全，改為 acknowledged 並保留追蹤紀錄。";
  if (replyState?.noResponseTimeout) return "30 秒內未收到確認，升級通知家屬與居服員，必要時展示 119 流程。";
  if (score >= 90) return "Critical：先語音確認，同步通知家屬與居服員，必要時升級 119 展示流程。";
  if (score >= 60) return "Warning：要求患者低資料量回覆，並由照護端人工複核。";
  if (score >= 30) return "Watch：發送確認訊息並持續觀察返家恢復趨勢。";
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
  const communicationStrategy =
    patientStatus.signalQuality === "offline"
      ? "先寫入本地 buffer；恢復連線後保留 eventId 補送"
      : patientStatus.signalQuality === "weak" || patientStatus.packetDelaySeconds > 10
        ? "Critical helpEvent 優先傳送；ack timeout 後切換備援路徑"
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
    recommendedAction: recommendedActionFor(riskScore, replyState),
    updatedAt: nowIso()
  };
}

function priorityFor(level: OperationRiskLevel): AlertCase["priority"] {
  if (level === "critical") return "urgent";
  if (level === "warning") return "high";
  return "normal";
}

export function determineWorkflowState(alertCase: Pick<AlertCase, "status" | "riskLevel" | "helpEvent" | "patientStatus">): CareDemoState {
  if (alertCase.status === "resolved") return "resolved";
  if (alertCase.status === "arrived") return "homeCareWorkerDispatched";
  if (alertCase.status === "on_the_way" || alertCase.patientStatus.careWorkerDispatched) return "homeCareWorkerDispatched";
  if (alertCase.status === "no_response") return "escalationPending";
  if (alertCase.status === "acknowledged" || alertCase.patientStatus.acknowledgementStatus === "acknowledged") return "patientAcknowledged";
  if (alertCase.status === "contacting" || alertCase.patientStatus.acknowledgementStatus === "sent") return "patientAckWaiting";
  if (alertCase.patientStatus.familyNotified) return "familyNotified";
  if (alertCase.status === "assigned") return "caregiverReviewing";
  if (alertCase.helpEvent.active && alertCase.helpEvent.source === "bedside_button") return "bedsideHelpPressed";
  if (alertCase.riskLevel === "critical" || alertCase.riskLevel === "warning") return "anomalyDetected";
  if (alertCase.status === "pending") return "alertQueued";
  return "monitoring";
}

export function appendAuditLog(alertCase: AlertCase, event: Omit<AuditLogEntry, "id" | "timestamp">): AlertCase {
  const entry: AuditLogEntry = {
    id: `${alertCase.eventId}-${alertCase.timeline.length + 1}`,
    timestamp: nowIso(),
    ...event
  };

  return {
    ...alertCase,
    updatedAt: entry.timestamp,
    timeline: [...alertCase.timeline, entry]
  };
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
    workflowState: "alertQueued"
  };

  const withState = {
    ...alertCase,
    workflowState: determineWorkflowState(alertCase)
  };

  return appendAuditLog(withState, {
    source: "system",
    event: "system_created_alert",
    decision: `alertQueue created with riskScore = ${riskAssessment.riskScore}`,
    actor: "risk-engine",
    statusChange: "pending"
  });
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
    }
  };

  const nextAlert = appendAuditLog(
    {
      ...assignedCase,
      workflowState: determineWorkflowState(assignedCase)
    },
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
    }
  };

  return appendAuditLog(
    {
      ...nextCase,
      workflowState: determineWorkflowState(nextCase)
    },
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
  const statusByAction: Partial<Record<CareWorkflowAction, AlertStatus>> = {
    contactPatient: "contacting",
    markOnTheWay: "on_the_way",
    markArrived: "arrived",
    resolveCase: "resolved",
    noResponseTimeout: "no_response",
    assignCareWorker: "assigned",
    escalateEmergency: "assigned"
  };
  const nextStatus = statusByAction[actionType] ?? alertCase.status;
  const familyNotified = actionType === "notifyFamily" ? true : alertCase.patientStatus.familyNotified;
  const careWorkerDispatched = ["markOnTheWay", "markArrived"].includes(actionType)
    ? true
    : alertCase.patientStatus.careWorkerDispatched;
  const resolvedAt = actionType === "resolveCase" ? nowIso() : alertCase.helpEvent.resolvedAt;
  const acknowledgementStatus: PatientStatus["acknowledgementStatus"] =
    actionType === "sendLowDataConfirmation" || actionType === "contactPatient"
      ? "sent"
      : actionType === "noResponseTimeout"
        ? "retrying"
        : actionType === "resolveCase"
          ? "acknowledged"
          : alertCase.patientStatus.acknowledgementStatus;

  let nextRisk = alertCase.riskAssessment;
  if (actionType === "noResponseTimeout") {
    nextRisk = calculateRiskScore(alertCase.patientStatus, alertCase.helpEvent, { noResponseTimeout: true });
  }

  const nextCase: AlertCase = {
    ...alertCase,
    status: nextStatus,
    riskScore: nextRisk.riskScore,
    riskLevel: nextRisk.riskLevel,
    priority: priorityFor(nextRisk.riskLevel),
    riskAssessment: nextRisk,
    patientStatus: {
      ...alertCase.patientStatus,
      familyNotified,
      careWorkerDispatched,
      acknowledgementStatus
    },
    helpEvent: {
      ...alertCase.helpEvent,
      active: actionType === "resolveCase" ? false : alertCase.helpEvent.active,
      resolvedAt
    }
  };

  return appendAuditLog(
    {
      ...nextCase,
      workflowState: actionType === "escalateEmergency" ? "emergencyEscalated" : determineWorkflowState(nextCase)
    },
    {
      source: actionType === "noResponseTimeout" ? "system" : "care_worker",
      event: actionType,
      decision:
        actionType === "noResponseTimeout"
          ? `no response timeout, riskScore updated to ${nextRisk.riskScore}`
          : "manual operation recorded",
      actor: actionType === "noResponseTimeout" ? "communication-adapter" : "care-coordinator",
      statusChange: `${alertCase.status} -> ${nextStatus}`
    }
  );
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
    }
  };

  return appendAuditLog(
    {
      ...nextCase,
      workflowState: determineWorkflowState(nextCase)
    },
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
  const nextCase = {
    ...alertCase,
    status: nextStatus,
    riskScore: nextRisk.riskScore,
    riskLevel: nextRisk.riskLevel,
    priority: priorityFor(nextRisk.riskLevel),
    patientStatus: nextPatient,
    helpEvent: nextHelpEvent,
    riskAssessment: nextRisk,
    lowDataPacket: nextPacket
  };

  return appendAuditLog(
    {
      ...nextCase,
      workflowState: determineWorkflowState(nextCase)
    },
    {
      source: selectedKind === "patient_safe" ? "patient" : selectedKind === "worker_arrived" ? "care_worker" : "system",
      event,
      decision,
      actor: selectedKind === "worker_arrived" ? "field-worker" : "demo-event-generator",
      statusChange: `${alertCase.status} -> ${nextStatus}`
    }
  );
}
