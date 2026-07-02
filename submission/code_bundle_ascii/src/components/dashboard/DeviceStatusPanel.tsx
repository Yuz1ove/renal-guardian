import { BellRing, Router, Watch } from "lucide-react";
import type { BedsideCallPacket, WearablePacket } from "../../types";

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value))}%`;
}

export function DeviceStatusPanel({
  wearable,
  bedside
}: {
  wearable: WearablePacket;
  bedside: BedsideCallPacket;
}) {
  const syncDelayed = wearable.signalQuality < 35 || !bedside.deviceOnline;

  return (
    <div className="device-grid">
      <article>
        <Watch size={18} />
        <div>
          <strong>手環</strong>
          <span>在線，電量 {pct(wearable.battery)}，訊號 {pct(wearable.signalQuality)}</span>
        </div>
      </article>
      <article>
        <BellRing size={18} />
        <div>
          <strong>床邊呼叫器</strong>
          <span>
            {bedside.deviceOnline ? "在線" : "離線"}，電量 {pct(bedside.battery)}，最後觸發 {bedside.buttonPressed ? "剛剛" : "無"}
          </span>
        </div>
      </article>
      <article>
        <Router size={18} />
        <div>
          <strong>後台同步</strong>
          <span>{syncDelayed ? "延遲，建議確認網路" : "正常，資料已送達照護站"}</span>
        </div>
      </article>
    </div>
  );
}
