import type { RiskLevel } from "../../domain/careWorkflowTypes";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function StageBadge({
  children,
  riskLevel
}: {
  children: string;
  riskLevel?: RiskLevel;
}) {
  return (
    <span className={classNames("stage-badge", riskLevel && `stage-badge-${riskLevel}`)}>
      {children}
    </span>
  );
}
