import { Code2, FileJson2, ListChecks, TerminalSquare } from "lucide-react";
import {
  buildPacketSummary,
  riskLevelLabels,
  type CaseStep,
  type RuntimeLogEntry
} from "./caseScenario";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function BehindTheCodePanel({
  step,
  logs,
  showPackets
}: {
  step: CaseStep;
  logs: RuntimeLogEntry[];
  showPackets: boolean;
}) {
  const packetSummary = buildPacketSummary(step);

  return (
    <section className="code-runtime-panel" aria-label="Behind the Code">
      <header className="case-panel-heading">
        <div>
          <span>Behind the Code</span>
          <h3>背後程式運行</h3>
        </div>
        <b>{logs.length} logs</b>
      </header>

      <div className="runtime-console" role="log" aria-live="polite">
        <div className="runtime-console-bar">
          <TerminalSquare size={16} />
          <span>case-runtime/demo-patient-001</span>
        </div>
        <div className="runtime-log-list">
          {logs.map((entry) => (
            <p key={entry.id} className={classNames("runtime-log-line", `tone-${entry.tone}`)}>
              <span>{entry.stepTitle.replace("：", " / ")}</span>
              <code>{entry.text}</code>
            </p>
          ))}
        </div>
      </div>

      {showPackets ? (
        <article className="packet-summary-panel">
          <header>
            <FileJson2 size={16} />
            <span>Packet JSON 摘要</span>
          </header>
          <pre>{JSON.stringify(packetSummary, null, 2)}</pre>
        </article>
      ) : null}

      <article className="risk-reason-runtime">
        <header>
          <ListChecks size={16} />
          <span>Risk Engine 判斷原因</span>
        </header>
        <ul>
          {step.risk.reasons.map((reason) => (
            <li key={reason}>
              <Code2 size={14} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <footer>
          <b>{riskLevelLabels[step.risk.level]}</b>
          <span>{step.risk.recommendedAction}</span>
        </footer>
      </article>
    </section>
  );
}
