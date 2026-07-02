# 腎安守護最終完成度稽核

稽核日期：2026-06-29

## 結論

作品本體、3D 圖檔、示範程式、投稿圖檔、說明文件與驗證流程已達到可投稿狀態。  
目前未完成的真人步驟是附件一「參賽單位承諾書」與附件二「著作授權同意書」仍需親筆簽名或蓋章；附件三目前已有簽名與日期，但送出前仍需目視確認。簽名不可由程式或他人代簽。

## 明確需求稽核

### 1. 洗腎者佩戴裝置

狀態：已完成

證據：

- 3D 模型包含佩戴裝置。
- 螢幕顯示時間、心率、血壓與跌倒偵測。
- 互動示範可同步更新心率、血壓與跌倒狀態。
- 對應檔案：`src/main.js`、`src/risk.js`、`design_board_1.jpg`、`renal_guardian_three_part_system.glb`。

### 2. 床邊檢測器

狀態：已完成

證據：

- 3D 模型包含床邊檢測器。
- 畫面顯示活動狀態、床邊通話與 SOS 狀態。
- 跌倒或健康指數低於門檻時，可切換至求救/通話狀態。
- 對應檔案：`src/main.js`、`firmware/renal_guardian_monitor.ino`、`design_board_1.jpg`。

### 3. 居服員辦公室看板

狀態：已完成

證據：

- 3D 模型包含辦公室健康指數看板。
- 看板顯示多位被照顧者健康指數。
- 低於門檻或跌倒偵測時會顯示派員與立即協助。
- 對應檔案：`src/main.js`、`src/risk.js`、`design_board_2.jpg`、`renal_guardian_brief.pdf`。

## 投稿交付物稽核

狀態：已完成

已備妥檔案：

- `renal_guardian_submission.zip`
- `platform_upload_files/`
- `platform_upload_files.zip`
- `signing_packet/`
- `signing_packet.zip`
- `design_board_1.jpg`
- `design_board_2.jpg`
- `product_cutout.jpg`
- `product_cutout_transparent.png`
- `renal_guardian_three_part_system.glb`
- `demo_code.zip`
- `renal_guardian_brief.pdf`
- `judging_copy_zh.txt`
- `technical_specification_zh.md`
- `requirements_traceability_zh.md`
- `final_review_matrix_zh.md`
- `form_copy_variants_zh.txt`
- `checksums_sha256.txt`
- 三份附件 PDF

## 驗證稽核

狀態：已完成，僅保留人工簽名提醒

已通過指令：

```bash
npm run package:submission
npm run validate:submission
npm run build
```

驗證內容：

- A3 設計圖尺寸為 4961 x 3508。
- 正式產品去背圖為 JPG，尺寸 4961 x 3508，300dpi，且小於 5MB。
- 透明 PNG 去背圖作為補充檔。
- `renal_guardian_submission.zip` 檔名為 ASCII。
- `demo_code.zip` 內部檔名為 ASCII。
- 投稿包包含 GLB、設計圖、去背圖、程式碼、說明文件與附件。
- 平台分項上傳資料夾已包含 6 個必傳檔案與補充資料。
- GLB 結構驗證與示範程式風險邏輯驗證皆已納入 `npm run validate:submission`。
- 附件一、附件二會用已知未簽名 PDF 的 SHA-256 指紋提醒；替換成已簽名 PDF 後，未簽名基準提醒應消失。
- 附件三目前含簽名與日期，驗證器會提醒送出前需目視確認。
- `checksums_sha256.txt` 已列出主要檔案 SHA-256。

## 未完成項目

### 附件一與附件二親筆簽名或蓋章

狀態：需人工完成

原因：

- 附件一紅字要求隊伍成員親筆簽名或蓋章，不能直接繕打。
- 附件二紅字要求隊伍成員親筆簽名或蓋章，不能直接繕打。
- 這是正式授權與承諾文件，不應由 AI 或他人代簽。

輔助檔：

- `submission/signing_aid/attachment_1_signature_guide.png`
- `submission/signing_aid/attachment_1_signature_guide.pdf`
- `submission/signing_aid/attachment_2_signature_guide.png`
- `submission/signing_aid/attachment_2_signature_guide.pdf`
- `submission/signing_aid/attachment_3_signature_date_guide.png`
- `submission/signing_aid/attachment_3_signature_date_guide.pdf`
- `submission/signing_packet/`
- `submission/signing_packet.zip`

簽名後指令：

```bash
npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf
npm run validate:submission
```

## 上傳優先順序

1. 優先上傳 `submission/renal_guardian_submission.zip`。
2. 若平台要求分項上傳，使用 `submission/renal_guardian_submission/` 內各檔案。
3. 若表單需要文字，使用 `submission/form_copy_variants_zh.txt` 或 `submission/judging_copy_zh.txt`。

## 完成判定

作品設計與投稿包製作：完成。  
平台送出前法律/授權附件：待參賽者親筆簽名附件一、附件二，並目視確認附件三簽名日期後完成。
