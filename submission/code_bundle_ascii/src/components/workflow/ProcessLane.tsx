import type { ReactNode } from "react";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function ProcessLane({
  eyebrow,
  title,
  decision,
  children
}: {
  eyebrow: string;
  title: string;
  decision?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={classNames("process-lane", decision && "process-lane-decision")} aria-label={eyebrow}>
      <div className="process-lane-title">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      {children}
    </section>
  );
}
