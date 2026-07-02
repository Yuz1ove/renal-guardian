import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { RiskLevel, WorkflowStage } from "../../domain/careWorkflowTypes";
import { StageBadge } from "./StageBadge";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export interface ProcessNodeProps {
  stage: WorkflowStage;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  kind: "source" | "event" | "packet" | "decision" | "action" | "feedback";
  chips?: string[];
  active?: boolean;
  selected?: boolean;
  riskLevel?: RiskLevel;
  muted?: boolean;
  metric?: ReactNode;
  onClick?: () => void;
}

function NodeInner({
  icon: Icon,
  eyebrow,
  title,
  description,
  chips,
  metric,
  riskLevel
}: ProcessNodeProps) {
  return (
    <>
      <span className="process-node-icon" aria-hidden="true">
        <Icon size={18} />
      </span>
      <span className="process-node-copy">
        <span className="process-node-eyebrow">{eyebrow}</span>
        <strong>{title}</strong>
        <span className="process-node-description">{description}</span>
      </span>
      {metric ? <span className="process-node-metric">{metric}</span> : null}
      {chips?.length ? (
        <span className="process-node-badges">
          {chips.map((chip) => (
            <StageBadge key={chip} riskLevel={riskLevel}>
              {chip}
            </StageBadge>
          ))}
        </span>
      ) : null}
    </>
  );
}

export function ProcessNode(props: ProcessNodeProps) {
  const className = classNames(
    "process-node",
    `process-node-${props.kind}`,
    props.riskLevel && `risk-${props.riskLevel}`,
    props.active && "is-active",
    props.selected && "is-current",
    props.muted && "is-muted"
  );

  if (props.onClick) {
    return (
      <button type="button" className={className} onClick={props.onClick} aria-pressed={props.selected}>
        <NodeInner {...props} />
      </button>
    );
  }

  return (
    <article className={className}>
      <NodeInner {...props} />
    </article>
  );
}
