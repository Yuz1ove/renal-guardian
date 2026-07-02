# 腎安守護示範程式邏輯稽核

稽核日期：2026-06-29

## 目的

本文件用來證明示範程式不是單純展示 UI，而是有可重跑的風險判斷與派員邏輯。

## 驗證指令

```bash
npm run validate:demo
```

此指令會執行 `scripts/validate-demo-logic.mjs`，直接匯入 `src/risk.js` 的 `calculateDialysisRisk()` 進行測試。

## 測試情境

| 情境 | 輸入摘要 | 預期結果 |
| --- | --- | --- |
| 穩定恢復 | 收縮壓 112、心率 92、活動 78、無跌倒 | 健康指數 81，狀態「穩定」 |
| 活動下降觀察 | 收縮壓 100、心率 92、活動 60、無跌倒 | 健康指數 59，狀態「觀察」 |
| 派員門檻 | 收縮壓 88、心率 118、活動 45、無跌倒 | 健康指數 21，狀態「派員確認」 |
| 生命徵象危急 | 收縮壓 88、心率 118、活動 20、無跌倒 | 健康指數 9，狀態「立即協助」 |
| 跌倒偵測 | 收縮壓 112、心率 92、活動 78、有跌倒 | 健康指數 20，狀態「立即協助」 |

## 互動展示檢查

驗證腳本也會檢查 `src/main.js` 是否包含：

- 穿戴端畫面 `wearableScreen`
- 床邊檢測器畫面 `bedsideScreen`
- 辦公室即時列 `officeCurrentRow`
- 辦公室警示 `officeAlert`
- 床邊通話開啟 `床邊通話 OPEN`
- SOS 求救 `SOS 求救`
- 派員提示 `立即派員`

## 硬體草稿檢查

驗證腳本也會檢查 `firmware/renal_guardian_monitor.ino` 是否包含：

- `calculateHealthIndex`
- `alarmAndOpenCall`
- `dispatchCareWorker`
- `fallDetected`
- `activityIndex`

## 投稿意義

此驗證補強「技術可行性」評分項，說明腎安守護已具備可操作的健康指數判斷、跌倒強制求救、低分派員與床邊通話流程。

互動頁面另有 Playwright runtime 驗證：

```bash
npm run validate:runtime
```

此指令會啟動 Vite、開啟瀏覽器、檢查初始健康指數，並操作跌倒偵測滑桿確認狀態切換。
