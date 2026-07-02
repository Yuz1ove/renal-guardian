export function calculateDialysisRisk({ systolicBp, heartRate, activityIndex, fallDetected }) {
  const bpRisk = systolicBp < 90 ? 35 : systolicBp < 105 ? 22 : systolicBp > 165 ? 20 : 8;
  const heartRisk = heartRate > 115 ? 24 : heartRate > 100 ? 16 : heartRate < 55 ? 18 : 7;
  const activityRisk = activityIndex < 35 ? 32 : activityIndex < 55 ? 20 : activityIndex < 70 ? 12 : 4;
  const fallRisk = fallDetected ? 36 : 0;
  const riskScore = Math.min(100, Math.round(bpRisk + heartRisk + activityRisk + fallRisk));
  const healthIndex = fallDetected ? Math.min(20, Math.max(0, 100 - riskScore)) : Math.max(0, 100 - riskScore);

  if (healthIndex <= 20 || fallDetected) {
    return {
      score: healthIndex,
      level: "立即協助",
      tone: "critical",
      message: "健康指數過低或偵測到跌倒，辦公室端須立即派員並啟動求救聯繫。"
    };
  }

  if (healthIndex <= 40) {
    return {
      score: healthIndex,
      level: "派員確認",
      tone: "warning",
      message: "健康指數低於門檻，居服員辦公室須通知看護並前往確認。"
    };
  }

  if (healthIndex <= 65) {
    return {
      score: healthIndex,
      level: "觀察",
      tone: "watch",
      message: "活動狀態下降，床邊檢測器持續追蹤並開放語音聯繫。"
    };
  }

  return {
    score: healthIndex,
    level: "穩定",
    tone: "stable",
    message: "目前健康指數穩定，穿戴裝置、床邊檢測器與辦公室看板持續同步。"
  };
}
