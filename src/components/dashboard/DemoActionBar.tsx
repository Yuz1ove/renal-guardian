import { BellRing, CheckCircle2, Watch } from "lucide-react";

export function DemoActionBar({
  onWearablePacket,
  onHelpEvent,
  onAssignmentSync
}: {
  onWearablePacket: () => void;
  onHelpEvent: () => void;
  onAssignmentSync: () => void;
}) {
  return (
    <div className="dashboard-actions" aria-label="demo actions">
      <button type="button" onClick={onWearablePacket}>
        <Watch size={16} />
        接收 telemetry
      </button>
      <button type="button" onClick={onHelpEvent}>
        <BellRing size={16} />
        建立求助事件
      </button>
      <button type="button" className="is-done" onClick={onAssignmentSync}>
        <CheckCircle2 size={16} />
        同步分派
      </button>
    </div>
  );
}
