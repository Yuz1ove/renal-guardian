import { Check, CheckCheck } from "lucide-react";
import { useMemo } from "react";
import { sortWeight } from "../../lib/riskScoring";
import { useCareStore } from "../../store/careStore";
import type { TaskStatus } from "../../types";
import { RiskBadge } from "./RiskBadge";

const statusLabel: Record<TaskStatus, string> = {
  pending: "待處理",
  acknowledged: "已確認",
  resolved: "已完成"
};

export function CaregiverDashboard() {
  const patients = useCareStore((state) => state.patients);
  const riskResults = useCareStore((state) => state.riskResults);
  const tasks = useCareStore((state) => state.tasks);
  const selectPatient = useCareStore((state) => state.selectPatient);
  const updateTaskStatus = useCareStore((state) => state.updateTaskStatus);

  const rows = useMemo(() => {
    return patients
      .map((patient) => ({
        patient,
        risk: riskResults[patient.id],
        task: tasks.find((task) => task.patientId === patient.id)
      }))
      .sort((a, b) => {
        const levelDelta = sortWeight(b.risk.level) - sortWeight(a.risk.level);
        if (levelDelta !== 0) return levelDelta;
        return b.risk.score - a.risk.score;
      });
  }, [patients, riskResults, tasks]);

  return (
    <section className="care-dashboard">
      <div className="dashboard-header">
        <strong>居服員／照護團隊後台</strong>
        <span>依 critical &gt; warning &gt; attention &gt; stable 排序</span>
      </div>
      <div className="care-table" role="table" aria-label="居服員後台風險列表">
        <div className="care-table-head" role="row">
          <span>姓名</span>
          <span>房間</span>
          <span>分數</span>
          <span>等級</span>
          <span>主要原因</span>
          <span>狀態</span>
        </div>
        {rows.map(({ patient, risk, task }) => (
          <button className="care-row" key={patient.id} onClick={() => selectPatient(patient.id)} role="row">
            <span>{patient.name}</span>
            <span>{patient.room}</span>
            <strong>{risk.score}</strong>
            <RiskBadge level={risk.level} />
            <span>{risk.reasons[0]}</span>
            <span>{task ? statusLabel[task.status] : "持續觀察"}</span>
          </button>
        ))}
      </div>
      {tasks[0] ? (
        <div className="task-actions">
          <div>
            <strong>{tasks[0].title}</strong>
            <p>{tasks[0].reason}</p>
          </div>
          <button onClick={() => updateTaskStatus(tasks[0].id, "acknowledged")} disabled={tasks[0].status !== "pending"}>
            <Check size={16} />
            標記已確認
          </button>
          <button onClick={() => updateTaskStatus(tasks[0].id, "resolved")} disabled={tasks[0].status === "resolved"}>
            <CheckCheck size={16} />
            標記已完成
          </button>
        </div>
      ) : null}
    </section>
  );
}
