import { formatTime } from "../../lib/eventLog";
import type { EventLogItem } from "../../types";
import { RiskBadge } from "./RiskBadge";

export function EventTimeline({ events }: { events: EventLogItem[] }) {
  return (
    <ol className="event-timeline" aria-label="事件時間線">
      {events.map((event) => (
        <li key={event.id}>
          <time>{formatTime(event.timestamp)}</time>
          <div>
            <div className="timeline-title">
              <strong>{event.title}</strong>
              <RiskBadge level={event.level} />
            </div>
            <p>{event.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
