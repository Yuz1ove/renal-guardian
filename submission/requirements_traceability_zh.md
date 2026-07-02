# 腎安守護需求對照表

本文件用來確認作品已回應原始投稿需求，並列出對應證據檔案。

## 需求 1：洗腎者佩戴裝置

要求：

- 洗腎者可佩戴。
- 裝置上需有時間。
- 裝置上需有心率。
- 裝置上需有血壓。
- 裝置需有跌倒偵測。

已完成設計：

- 3D 模型中有洗腎者佩戴裝置。
- 裝置螢幕顯示 `14:30`、`HR 92`、`BP 112/72`、`FALL OK`。
- 互動示範中調整心率、血壓與跌倒偵測時，3D 裝置螢幕會同步更新。

證據：

- `src/main.js`：`makeWearable()`、`wearableScreen`、風險控制同步邏輯。
- `src/risk.js`：跌倒偵測會讓健康指數進入立即協助狀態。
- `design_board_1.jpg`：展示佩戴裝置外觀與功能。
- `renal_guardian_three_part_system.glb`：包含佩戴裝置 3D 模型。
- `renal_guardian_brief.pdf`：第一頁展示三端式產品圖。

## 需求 2：床邊檢測器

要求：

- 確保被照顧者有正常活動狀態。
- 必要時可以報警求救。
- 方便看護人員與其對話聯繫。

已完成設計：

- 3D 模型中有床邊檢測器與床邊活動偵測視覺。
- 檢測器畫面顯示活動狀態百分比、床邊通話與 SOS 狀態。
- 當健康指數低於門檻或跌倒偵測觸發時，畫面會切換至求救/通話狀態。

證據：

- `src/main.js`：`makeBedsideDetector()`、`bedsideScreen`、`SOS 求救`、`床邊通話 OPEN`。
- `firmware/renal_guardian_monitor.ino`：`alarmAndOpenCall()` 示範警報與通話流程。
- `design_board_1.jpg`：展示床邊檢測器與功能。
- `technical_specification_zh.md`：描述活動狀態、警報求救與通話聯繫。

## 需求 3：居服員辦公室看板

要求：

- 居服員辦公室需有不同被照顧者即時身體健康指數。
- 一旦低於一定量值，須馬上前往協助。

已完成設計：

- 3D 模型中有居服員辦公室看板。
- 看板顯示多位被照顧者健康指數。
- 互動示範右側辦公室看板同步更新當前個案健康指數。
- 健康指數低於 40 或跌倒偵測時，系統顯示派員與立即協助提示。

證據：

- `src/main.js`：`makeOfficeDashboard()`、`officeCurrentRow`、`officeAlert`、`dispatchNote`。
- `src/risk.js`：健康指數分級與派員門檻。
- `firmware/renal_guardian_monitor.ino`：`dispatchCareWorker()` 示範派員流程。
- `design_board_2.jpg`：展示三端式照護流程與基礎風險程式。
- `renal_guardian_brief.pdf`：第二頁展示輸入、判斷、行動流程。

## 示範程式驗證

已驗證項目：

- `npm run build` 通過。
- `npm run package:submission` 通過。
- `npm run validate:submission` 通過，僅保留附件一、附件二符合未簽名 SHA-256 基準的提醒；附件三需目視確認簽名與日期。
- 桌機與手機預覽曾以 Playwright 檢查：WebGL 載入、跌倒偵測觸發、手機版無水平溢出。

## 投稿檔案對應

- `design_board_1.jpg`：作品主視覺與三端硬體說明。
- `design_board_2.jpg`：系統流程與程式邏輯。
- `product_cutout.jpg`：正式投稿用 300dpi JPG 產品去背圖。
- `product_cutout_transparent.png`：透明背景產品圖補充檔。
- `renal_guardian_three_part_system.glb`：3D 模型。
- `demo_code.zip`：網頁示範程式與硬體草稿。
- `renal_guardian_brief.pdf`：兩頁式作品說明。
- `judging_copy_zh.txt`：表單文字素材。
- `technical_specification_zh.md`：技術說明。
