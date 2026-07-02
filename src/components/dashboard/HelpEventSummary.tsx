import { BellRing } from "lucide-react";
import type { CareCase, WorkflowViewModel } from "../../domain/careWorkflowTypes";

function sourceLabel(source: NonNullable<CareCase["helpEvent"]>["source"]) {
  if (source === "wristband") return "手環 SOS";
  if (source === "bedside") return "床邊";
  return "居家 gateway";
}

export function HelpEventSummary({ workflow }: { workflow: WorkflowViewModel }) {
  const helpEvent = workflow.case.helpEvent;
  const hasHelpEvent = Boolean(helpEvent?.active);

  return (
    <section className={hasHelpEvent ? "call-toast" : "call-toast is-muted"} aria-label="求助事件摘要">
      <BellRing size={18} />
      <div>
        <strong>求助事件摘要</strong>
        <p>
          {hasHelpEvent && helpEvent
            ? `${sourceLabel(helpEvent.source)}求助：${helpEvent.symptoms.join("、")}，priority ${helpEvent.priority}，${helpEvent.createdAt} 建立。`
            : "目前無主動求助事件，資料由手環 telemetry packet 進入風險引擎。"}
        </p>
      </div>
    </section>
  );
}
