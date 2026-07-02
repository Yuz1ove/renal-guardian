import type { RiskLevel } from "../../types";

const labelMap: Record<RiskLevel, string> = {
  stable: "穩定",
  attention: "需注意",
  warning: "中高風險",
  critical: "立即關注"
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`risk-badge risk-badge--${level}`}>{labelMap[level]}</span>;
}
