import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export interface ProcessNodeProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  kind: "source" | "event" | "packet" | "decision" | "action" | "feedback";
  active?: boolean;
  current?: boolean;
  muted?: boolean;
  badges?: string[];
  metric?: ReactNode;
  onClick?: () => void;
}

function NodeInner({ icon: Icon, eyebrow, title, description, badges, metric }: ProcessNodeProps) {
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
      {badges?.length ? (
        <span className="process-node-badges">
          {badges.map((badge) => (
            <span key={badge}>{badge}</span>
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
    props.active && "is-active",
    props.current && "is-current",
    props.muted && "is-muted"
  );

  if (props.onClick) {
    return (
      <button type="button" className={className} onClick={props.onClick} aria-pressed={props.current}>
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
