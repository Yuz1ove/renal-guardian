import { TableProperties } from "lucide-react";
import { riskMappingRows } from "./assistiveDeviceData";

export function RiskScoreMappingTable() {
  return (
    <section className="risk-mapping-section" aria-label="風險評估引擎關聯">
      <header className="assistive-section-header">
        <div>
          <span>Risk Engine Mapping</span>
          <h3>輔具資料如何影響風險分數</h3>
          <p>所有硬體標註都對應到後台風險引擎可讀取的欄位，避免只展示外觀而沒有資料邏輯。</p>
        </div>
        <TableProperties size={24} />
      </header>
      <div className="risk-table-wrap">
        <table>
          <thead>
            <tr>
              <th>資料來源</th>
              <th>觸發條件</th>
              <th>風險分數變化</th>
              <th>原因</th>
            </tr>
          </thead>
          <tbody>
            {riskMappingRows.map((row) => (
              <tr key={`${row.source}-${row.trigger}`}>
                <td>{row.source}</td>
                <td>{row.trigger}</td>
                <td><b>{row.delta}</b></td>
                <td>{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
