export const levelMeta = {
  stable: { label: "穩定", color: "#2f8f86", action: "持續觀察" },
  attention: { label: "需注意", color: "#d6a441", action: "家屬留意恢復狀況" },
  warning: { label: "中高風險", color: "#df7d2e", action: "居服員電話關懷或回報照護端" },
  critical: { label: "立即關注", color: "#c94b4b", action: "立即關注並確認是否需要聯絡家屬 / 醫療人員" }
};

export const baseDemoPatients = [
  {
    id: "p1",
    name: "侯冠宇",
    room: "A-203",
    heartRate: 52,
    spo2: 93,
    activityDelta: -8,
    signal: 62,
    battery: 81,
    callPressed: false,
    lastDialysisHours: 3,
    symptoms: ["頭暈", "冒冷汗", "下床困難"],
    score: 100,
    level: "critical",
    reason: "心率低於 55 bpm，且透析後返家恢復期活動量下降。"
  },
  {
    id: "p2",
    name: "黃美惠",
    room: "A-216",
    heartRate: 68,
    spo2: 95,
    activityDelta: -5,
    signal: 74,
    battery: 66,
    callPressed: false,
    lastDialysisHours: 5,
    symptoms: ["疲倦"],
    score: 58,
    level: "warning",
    reason: "透析後返家恢復期活動量偏低，需追蹤。"
  },
  {
    id: "p3",
    name: "林秀蘭",
    room: "B-118",
    heartRate: 72,
    spo2: 96,
    activityDelta: -2,
    signal: 88,
    battery: 92,
    callPressed: false,
    lastDialysisHours: 9,
    symptoms: [],
    score: 38,
    level: "attention",
    reason: "透析後疲倦回報，仍需觀察。"
  },
  {
    id: "p4",
    name: "陳文德",
    room: "C-071",
    heartRate: 76,
    spo2: 97,
    activityDelta: 0,
    signal: 91,
    battery: 70,
    callPressed: false,
    lastDialysisHours: 14,
    symptoms: [],
    score: 18,
    level: "stable",
    reason: "目前未觸發明顯風險加權。"
  }
];

function levelFromScore(score) {
  if (score >= 80) return "critical";
  if (score >= 50) return "warning";
  if (score >= 25) return "attention";
  return "stable";
}

export function calculateRiskScore(patient) {
  const reasons = [];
  let score = 0;
  const add = (points, reason) => {
    score += points;
    reasons.push({ points, reason });
  };

  if (patient.heartRate < 55) add(15, "心率低於 55 bpm");
  if (patient.heartRate > 110) add(15, "心率高於 110 bpm");
  if (patient.spo2 < 94) add(15, "血氧低於 94%");
  if (patient.activityDelta <= -5) add(20, "透析後活動量下降");
  if (patient.lastDialysisHours <= 6) add(10, "透析後 6 小時內返家恢復期");
  if (patient.symptoms.includes("頭暈")) add(15, "回報頭暈");
  if (patient.symptoms.includes("冒冷汗")) add(15, "回報冒冷汗");
  if (patient.callPressed === true) add(40, "床邊求助");
  if (patient.signal < 40) add(5, "資料不完整提醒");

  const boundedScore = Math.min(100, score);
  const level = levelFromScore(boundedScore);
  const reason =
    reasons.length > 0
      ? reasons.map((item) => `${item.reason} +${item.points}`).join("，")
      : "目前未觸發明顯風險加權。";

  return {
    score: boundedScore,
    level,
    reasons,
    reason,
    action: levelMeta[level].action
  };
}

export function scorePatients(patients) {
  return patients.map((patient) => {
    const risk = calculateRiskScore(patient);
    return { ...patient, ...risk };
  });
}

export function sortByRisk(patients) {
  const weight = { critical: 4, warning: 3, attention: 2, stable: 1 };
  return [...patients].sort((a, b) => {
    const levelDelta = weight[b.level] - weight[a.level];
    if (levelDelta !== 0) return levelDelta;
    return b.score - a.score;
  });
}

export function createEvent(message, status = "待確認") {
  return {
    id: `event-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    time: new Intl.DateTimeFormat("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date()),
    message,
    status
  };
}
