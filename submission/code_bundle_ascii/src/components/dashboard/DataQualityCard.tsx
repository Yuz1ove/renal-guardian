import { ShieldCheck } from "lucide-react";
import type { WorkflowViewModel } from "../../domain/careWorkflowTypes";

export function DataQualityCard({ workflow }: { workflow: WorkflowViewModel }) {
  const notes = workflow.risk.dataQualityNotes.length
    ? workflow.risk.dataQualityNotes
    : ["資料品質良好，可作為照護協作與風險提醒的趨勢參考。"];

  return (
    <section className="data-quality-card" aria-label="資料品質與評估信心">
      <header>
        <ShieldCheck size={16} />
        <div>
          <strong>資料品質</strong>
          <span>dataQuality {workflow.risk.dataQuality}｜confidence {workflow.risk.confidence}</span>
        </div>
      </header>
      <ul>
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  );
}
