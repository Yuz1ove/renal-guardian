import { useState } from "react";
import type { PatientWithRisk } from "./mockPatients";

const levelLabel = {
  stable: "Stable",
  watch: "Watch",
  warning: "Warning",
  critical: "Critical"
};

export function RiskQueue({
  patients,
  activePatientId,
  assigned,
  onSelectPatient,
  onFocusA203
}: {
  patients: PatientWithRisk[];
  activePatientId: string;
  assigned: boolean;
  onSelectPatient: (patientId: string) => void;
  onFocusA203: () => void;
}) {
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());

  function mark(patient: PatientWithRisk) {
    setMarkedIds((current) => new Set(current).add(patient.id));
    onSelectPatient(patient.id);
    if (patient.id === "a203") onFocusA203();
  }

  return (
    <section className="risk-queue" aria-label="照護端風險隊列">
      <header>
        <div>
          <span>Care Queue</span>
          <strong>照護端風險隊列</strong>
        </div>
        <em>{patients.length} 筆</em>
      </header>
      <div className="risk-queue-list">
        {patients.map((patient) => {
          const marked = markedIds.has(patient.id);
          const isAssignedA203 = assigned && patient.id === "a203";
          const actionLabel = isAssignedA203 ? "已分派照護人員" : patient.statusAction;
          return (
            <article key={patient.id} className={patient.id === activePatientId ? "is-active" : ""}>
              <button className="queue-main" type="button" onClick={() => onSelectPatient(patient.id)}>
                <span>{patient.displayId}</span>
                <strong>{patient.name}</strong>
                <b>{patient.risk.score}</b>
                <em className={`level-${patient.risk.level}`}>{levelLabel[patient.risk.level]}</em>
              </button>
              <p>
                <strong>{levelLabel[patient.risk.level]}｜{actionLabel}</strong>
                <span>{patient.queueSummary}</span>
              </p>
              <button className={marked || isAssignedA203 ? "queue-action is-done" : "queue-action"} type="button" onClick={() => mark(patient)}>
                {marked || isAssignedA203 ? actionLabel : patient.statusAction}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
