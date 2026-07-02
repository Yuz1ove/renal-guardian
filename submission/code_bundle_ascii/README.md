# 腎安守護

洗腎患者真正危險的時刻，不只是在透析室，而是在離開透析室後的返家與居家恢復期。本作品以三端式照護系統補上醫療照護與家庭照護之間的空白，讓患者、看護與居服員辦公室能在風險發生前採取行動。

## 三個核心設備

1. 洗腎者佩戴裝置：顯示時間、心率、血壓與跌倒偵測。
2. 床邊檢測器：確認被照顧者活動狀態，必要時報警求救並支援對話聯繫。
3. 居服員辦公室看板：同步不同被照顧者的即時健康指數，低於門檻時派員協助。

## 前端原型架構

- `src/App.tsx`：React 展示入口，啟動 2 秒一次的模擬裝置資料流。
- `src/components/three/ThreeCareScene.tsx`：可旋轉縮放的 3D 居家照護場景。
- `src/components/dashboard/MonitoringPanel.tsx`：右側即時監測、事件時間線與建議處置。
- `src/components/dashboard/CaregiverDashboard.tsx`：居服員後台風險排序與任務處理。
- `src/data/demoPatients.ts`：展示病患資料。
- `src/data/devicePackets.ts`：手環與床邊呼叫器封包資料。
- `src/lib/riskScoring.ts`：規則式風險評分邏輯。
- `src/lib/simulateDeviceStream.ts`：穩定、透析後虛弱、緊急事件三種資料流模擬。
- `src/store/careStore.ts`：Zustand 狀態管理，集中處理風險、事件、任務與 UI 切換。
- `firmware/renal_guardian_monitor.ino`：硬體端基礎程式草稿。
- `腎安守護-三端式照護系統.glb`：三端式 3D 模型圖檔。
- `作品設計圖檔1-腎安守護.jpg`：A3 橫式投稿設計圖。
- `作品設計圖檔2-腎安守護.jpg`：A3 橫式投稿設計圖。
- `作品去背圖檔-腎安守護.jpg`：正式投稿用 300dpi JPG 產品去背圖。
- `作品去背圖檔-腎安守護.png`：透明背景產品圖補充檔。
- `submission/renal_guardian_submission.zip`：英文檔名投稿包，建議優先使用。
- `submission/腎安守護_投稿包.zip`：中文檔名投稿包。
- `submission/platform_upload_files/`：平台分項上傳專用資料夾，只放必傳檔案與補充資料。
- `submission/platform_upload_files.zip`：平台分項上傳資料夾的壓縮備份。
- `submission/signing_packet/`：附件簽名交接包，含附件一、二簽名位置與附件三確認位置。
- `submission/signing_packet.zip`：附件簽名交接包壓縮備份。
- `submission/platform_field_values_zh.txt`：平台欄位可複製文字。
- `submission/judging_copy_zh.txt`：評審欄位可複製文字。
- `submission/technical_specification_zh.md`：技術與系統說明。
- `submission/renal_guardian_brief.pdf`：兩頁式作品說明書。
- `submission/requirements_traceability_zh.md`：原始需求與完成證據對照表。
- `submission/completion_audit_zh.md`：最終完成度與剩餘人工簽名項目稽核。
- `submission/competition_requirements_zh.md`：比賽規格、評審標準與檔案規格對照。
- `submission/platform_upload_guide_zh.md`：平台欄位與分項上傳檔案指南。
- `submission/runtime_verification_zh.md`：建置、驗證與真瀏覽器互動測試紀錄。
- `submission/glb_model_audit_zh.md`：GLB 3D 模型節點與結構驗證紀錄。
- `submission/demo_logic_audit_zh.md`：健康指數、跌倒、派員與通話邏輯驗證紀錄。
- `submission/final_review_matrix_zh.md`：官方規格、產品需求、評審重點與剩餘人工項目總表。
- `submission/form_copy_variants_zh.txt`：不同字數版本的表單貼文。
- `submission/renal_guardian_submission/checksums_sha256.txt`：主要投稿檔案完整性校驗清單。

## 本機預覽

```bash
npm run dev -- --port 5173
```

開啟 `http://127.0.0.1:5173/` 可以操作 3D 場景、三個 demo 情境按鈕、床邊呼叫器與居服員後台。若本機 5173 已被其他專案佔用，可改用 `npm run dev -- --host 127.0.0.1 --port 5174`。自動化瀏覽器驗證會自行啟動臨時空 port。

首頁展示流程：

- 點擊 3D 手環或「手環」分頁，可查看心率、活動、姿態、SOS、電量與訊號品質。
- 點擊 3D 床邊呼叫器或「床邊呼叫」卡片，會產生床邊求助事件。
- 點擊 3D 居服員看板或「後台」分頁，可查看多位個案依風險排序的任務清單。
- 使用「模擬穩定狀態」、「模擬透析後虛弱」、「模擬緊急事件」三個按鈕，可即時改變 3D 燈號、右側風險、事件時間線與後台任務。
- 在後台可按「標記已確認」與「標記已完成」，事件時間線會留下處理紀錄。

## 重建投稿包

附件一與附件二簽名後，可用下列指令替換並重建投稿包。附件三目前含簽名與日期，上傳前仍需目視確認；若重新掃描附件三，也可用 `--attachment3` 替換。

簽名位置輔助圖在：

- `submission/signing_packet/`
- `submission/signing_packet.zip`
- `submission/signing_aid/attachment_1_signature_guide.png`
- `submission/signing_aid/attachment_1_signature_guide.pdf`
- `submission/signing_aid/attachment_2_signature_guide.png`
- `submission/signing_aid/attachment_2_signature_guide.pdf`
- `submission/signing_aid/attachment_3_signature_date_guide.png`
- `submission/signing_aid/attachment_3_signature_date_guide.pdf`

```bash
npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf
```

若只是用目前檔案重新打包：

```bash
npm run package:submission
```

重打包後可執行：

```bash
npm run validate:submission
```

驗證器會檢查投稿包必要檔案、平台分項上傳資料夾、圖片尺寸、正式 JPG 的 300dpi 與 5MB 上限、GLB 3D 模型結構、示範程式風險邏輯、zip 內容與 ASCII 檔名，並以未簽名附件一、二的 SHA-256 指紋提醒簽名狀態。

若要重跑真瀏覽器互動驗證：

```bash
npm run validate:runtime
```

## 投稿檢查

- 穿戴裝置畫面包含時間、心率、血壓與跌倒偵測。
- 床邊檢測器包含活動狀態、求救警報與床邊通話。
- 居服員辦公室看板包含多位被照顧者健康指數與低分派員提示。
- 右側示範程式可調整血壓、心率、活動指數與跌倒偵測，3D 螢幕與辦公室分數會同步更新。
- 設計圖與正式去背圖皆為 300dpi JPG 且小於 5MB。
- 若平台或評審端可能出現中文檔名亂碼，優先上傳或提供 `submission/renal_guardian_submission.zip`。
