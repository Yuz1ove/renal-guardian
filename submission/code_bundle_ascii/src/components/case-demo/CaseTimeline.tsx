import { Check, Circle, RadioTower } from "lucide-react";
import {
  careResponseStages,
  getCareStageIndex,
  type CaseStep
} from "./caseScenario";

function classNames(...tokens: Array<string | false | undefined>) {
  return tokens.filter(Boolean).join(" ");
}

export function CaseTimeline({ step }: { step: CaseStep }) {
  const activeIndex = getCareStageIndex(step.careFlow.currentStage);

  return (
    <section className="case-response-timeline" aria-label="Care Response Timeline">
      <header>
        <span>Care Response Timeline</span>
        <strong>照護端處理進度</strong>
      </header>
      <ol>
        {careResponseStages.map((stage, index) => {
          const isDone = activeIndex >= 0 && index < activeIndex;
          const isActive = activeIndex === index;
          return (
            <li
              key={stage.id}
              className={classNames(isDone && "is-done", isActive && "is-active")}
            >
              <i>
                {isDone ? <Check size={14} /> : isActive ? <RadioTower size={14} /> : <Circle size={14} />}
              </i>
              <div>
                <b>{stage.label}</b>
                <span>{stage.detail}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
