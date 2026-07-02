import { Code2, Database, Send } from "lucide-react";
import { toLowBandwidthWearableJson } from "../../data/devicePackets";
import { useCareStore } from "../../store/careStore";

export function TechExplanationPanel() {
  const wearable = useCareStore((state) => state.wearablePacket);
  const lowPacket = toLowBandwidthWearableJson(wearable);

  return (
    <section className="tech-panel">
      <div className="flow-row">
        <span>手環 / 呼叫器</span>
        <Send size={16} />
        <span>device packet</span>
        <Send size={16} />
        <span>gateway / API</span>
        <Send size={16} />
        <span>risk engine</span>
        <Send size={16} />
        <span>照護後台</span>
      </div>
      <div className="tech-copy">
        <Code2 size={18} />
        <p>手環端只上傳必要欄位，降低網路不穩時的資料量；後端根據時間序列與規則式風險模型計算健康指數，再推送給照護團隊。</p>
      </div>
      <div className="packet-preview">
        <Database size={16} />
        <pre>{JSON.stringify(lowPacket, null, 2)}</pre>
      </div>
    </section>
  );
}
