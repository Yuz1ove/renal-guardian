import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react";
import type { TimelineItem } from "../../domain/careWorkflowTypes";

const statusIcon = {
  done: CheckCircle2,
  active: Clock3,
  pending: CircleDashed
};

export function ProcessTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <section className="process-timeline" aria-label="流程事件時間序">
      <header>
        <span>Process Timeline</span>
        <strong>事件時間序</strong>
      </header>
      <ol>
        {items.map((item) => {
          const Icon = statusIcon[item.status];
          return (
            <li key={item.id} className={`is-${item.status}`}>
              <span className="timeline-time">{item.time}</span>
              <span className="timeline-icon" aria-hidden="true">
                <Icon size={14} />
              </span>
              <span className="timeline-copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
