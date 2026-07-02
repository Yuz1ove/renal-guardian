import { create } from "zustand";
import { initialBedsidePacket, initialWearablePacket } from "../data/devicePackets";
import { demoPatients } from "../data/demoPatients";
import { createEvent } from "../lib/eventLog";
import { calculateRiskResult, priorityFromRisk, sortWeight } from "../lib/riskScoring";
import { simulateBedsidePacket, simulateWearablePacket } from "../lib/simulateDeviceStream";
import type {
  ActiveView,
  BedsideCallPacket,
  CaregiverTask,
  DemoScenario,
  EventLogItem,
  Patient,
  RiskResult,
  TaskStatus,
  WearablePacket
} from "../types";

interface CareState {
  activePatientId: string;
  activeView: ActiveView;
  scenario: DemoScenario;
  patients: Patient[];
  wearablePacket: WearablePacket;
  bedsidePacket: BedsideCallPacket;
  riskResults: Record<string, RiskResult>;
  tasks: CaregiverTask[];
  events: EventLogItem[];
  streamTick: number;
  setActiveView: (view: ActiveView) => void;
  selectPatient: (patientId: string) => void;
  simulateScenario: (scenario: DemoScenario) => void;
  applyStreamTick: () => void;
  triggerBedsideCall: (emergency?: boolean) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

const now = new Date();
const initialRisk = calculateRiskResult(demoPatients[0], initialWearablePacket, initialBedsidePacket, now);

const backgroundRisks: Record<string, RiskResult> = {
  P002: {
    patientId: "P002",
    score: 38,
    level: "attention",
    reasons: ["透析後疲倦回報 +8", "活動量較平日下降 +12"],
    recommendedActions: ["請家屬確認患者精神與活動狀態", "30 分鐘後再次檢查生命徵象"],
    updatedAt: now.toISOString()
  },
  P003: {
    patientId: "P003",
    score: 18,
    level: "stable",
    reasons: ["目前未觸發風險加分規則"],
    recommendedActions: ["持續觀察", "維持一般返家休息紀錄"],
    updatedAt: now.toISOString()
  },
  P004: {
    patientId: "P004",
    score: 58,
    level: "warning",
    reasons: ["透析後返家恢復期 +15", "活動量偏低 +12", "長時間躺臥 +10"],
    recommendedActions: ["建議居服員或家屬主動聯繫", "確認是否有頭暈、冒冷汗、虛弱、跌倒風險"],
    updatedAt: now.toISOString()
  }
};

function taskForRisk(risk: RiskResult, existing?: CaregiverTask): CaregiverTask | null {
  if (risk.level === "stable") return existing ?? null;
  const priority = priorityFromRisk(risk.level);
  return {
    id: existing?.id ?? `TASK-${risk.patientId}`,
    patientId: risk.patientId,
    priority,
    title: risk.level === "critical" ? "立即關注返家風險" : "返家恢復期主動確認",
    reason: risk.reasons[0],
    status: existing?.status ?? "pending",
    createdAt: existing?.createdAt ?? new Date().toISOString()
  };
}

function buildInitialTasks() {
  return Object.values({ P001: initialRisk, ...backgroundRisks })
    .map((risk) => taskForRisk(risk))
    .filter((task): task is CaregiverTask => Boolean(task));
}

function upsertRiskTask(tasks: CaregiverTask[], risk: RiskResult) {
  const existing = tasks.find((task) => task.patientId === risk.patientId);
  const nextTask = taskForRisk(risk, existing);
  if (!nextTask) return tasks.filter((task) => task.patientId !== risk.patientId);
  return [...tasks.filter((task) => task.patientId !== risk.patientId), nextTask];
}

function sortTasks(tasks: CaregiverTask[], riskResults: Record<string, RiskResult>) {
  return [...tasks].sort((a, b) => {
    const riskA = riskResults[a.patientId];
    const riskB = riskResults[b.patientId];
    const levelDelta = sortWeight(riskB.level) - sortWeight(riskA.level);
    if (levelDelta !== 0) return levelDelta;
    return riskB.score - riskA.score;
  });
}

export const useCareStore = create<CareState>((set, get) => ({
  activePatientId: "P001",
  activeView: "summary",
  scenario: "stable",
  patients: demoPatients,
  wearablePacket: initialWearablePacket,
  bedsidePacket: initialBedsidePacket,
  riskResults: {
    P001: initialRisk,
    ...backgroundRisks
  },
  tasks: buildInitialTasks(),
  events: [
    createEvent("患者透析後返家", "手環與床邊呼叫器完成連線，開始返家恢復期監測。", "stable"),
    createEvent("手環回傳資料", "低資料量封包已送往居家閘道器。", "stable")
  ],
  streamTick: 0,
  setActiveView: (view) => set({ activeView: view }),
  selectPatient: (patientId) => set({ activePatientId: patientId, activeView: "dashboard" }),
  simulateScenario: (scenario) => {
    const tick = get().streamTick + 1;
    const wearablePacket = simulateWearablePacket(get().wearablePacket, scenario, tick);
    const bedsidePacket = simulateBedsidePacket(get().bedsidePacket, scenario, tick);
    const patient = get().patients.find((item) => item.id === get().activePatientId) ?? get().patients[0];
    const risk = calculateRiskResult(patient, wearablePacket, bedsidePacket);
    const riskResults = { ...get().riskResults, [patient.id]: risk };
    const taskList = sortTasks(upsertRiskTask(get().tasks, risk), riskResults);
    const scenarioEvent =
      scenario === "stable"
        ? createEvent("切換為穩定狀態", "健康指數回到穩定觀察，裝置燈號改為綠色。", "stable")
        : scenario === "weak"
          ? createEvent("透析後返家恢復期活動下降", "心率上升、活動指數下降，系統產生中風險任務。", "attention")
          : createEvent("偵測到高風險事件", "手環跌倒偵測與 SOS 觸發，系統已推送照護團隊。", "critical");
    const extraEvents =
      scenario === "emergency"
        ? [
            createEvent("系統已推送照護團隊", "居服員後台已將個案排序至最上方。", "critical"),
            createEvent("等待居服員確認", "目前任務狀態為待處理。", "critical")
          ]
        : [];

    set({
      scenario,
      streamTick: tick,
      wearablePacket,
      bedsidePacket,
      riskResults,
      tasks: taskList,
      events: [scenarioEvent, ...extraEvents, ...get().events].slice(0, 12)
    });
  },
  applyStreamTick: () => {
    const tick = get().streamTick + 1;
    const wearablePacket = simulateWearablePacket(get().wearablePacket, get().scenario, tick);
    const bedsidePacket = simulateBedsidePacket(get().bedsidePacket, get().scenario, tick);
    const patient = get().patients.find((item) => item.id === get().activePatientId) ?? get().patients[0];
    const risk = calculateRiskResult(patient, wearablePacket, bedsidePacket);
    const riskResults = { ...get().riskResults, [patient.id]: risk };
    const events =
      tick % 2 === 0
        ? [createEvent("手環回傳資料", `HR ${wearablePacket.heartRate}，活動指數 ${wearablePacket.activityIndex}。`, risk.level), ...get().events]
        : get().events;
    set({
      streamTick: tick,
      wearablePacket,
      bedsidePacket,
      riskResults,
      tasks: sortTasks(upsertRiskTask(get().tasks, risk), riskResults),
      events: events.slice(0, 12)
    });
  },
  triggerBedsideCall: (emergency = false) => {
    const bedsidePacket: BedsideCallPacket = {
      ...get().bedsidePacket,
      timestamp: new Date().toISOString(),
      buttonPressed: true,
      longPressEmergency: emergency,
      noResponseMinutes: emergency ? 12 : 1
    };
    const wearablePacket: WearablePacket = emergency
      ? { ...get().wearablePacket, sosPressed: true, fallDetected: true, systolicBP: 84, activityIndex: 8, posture: "lying" }
      : get().wearablePacket;
    const patient = get().patients.find((item) => item.id === get().activePatientId) ?? get().patients[0];
    const risk = calculateRiskResult(patient, wearablePacket, bedsidePacket);
    const riskResults = { ...get().riskResults, [patient.id]: risk };
    set({
      activeView: "bedside",
      scenario: emergency ? "emergency" : get().scenario,
      wearablePacket,
      bedsidePacket,
      riskResults,
      tasks: sortTasks(upsertRiskTask(get().tasks, risk), riskResults),
      events: [
        createEvent(
          emergency ? "床邊呼叫器長按緊急求助" : "床邊呼叫器觸發",
          emergency ? "患者長按 3 秒，風險等級提升為立即關注。" : "患者請求協助，照護團隊可從後台確認。",
          emergency ? "critical" : "attention"
        ),
        ...get().events
      ].slice(0, 12)
    });
  },
  updateTaskStatus: (taskId, status) => {
    const tasks = get().tasks.map((task) => (task.id === taskId ? { ...task, status } : task));
    const event =
      status === "acknowledged"
        ? createEvent("居服員已確認警示", "任務狀態改為已確認，準備聯繫家屬或前往確認。", "attention")
        : createEvent("事件已處理", "任務狀態改為已完成，個案維持持續觀察。", "stable");
    set({
      tasks,
      events: [event, ...get().events].slice(0, 12)
    });
  }
}));
