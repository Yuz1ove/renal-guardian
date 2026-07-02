# 腎安守護最終審查矩陣

稽核日期：2026-06-29

## 總結

腎安守護的作品本體、3D 模型、示範程式、設計圖、去背圖、說明文件、欄位文字、打包流程與驗證流程已完成。  
剩餘人工項目是附件一「參賽單位承諾書」與附件二「著作授權同意書」需由參賽者親筆簽名或蓋章；附件三目前含簽名與日期，上傳前仍需目視確認。

## 官方投稿規格

| 要求 | 對應檔案 / 證據 | 狀態 |
| --- | --- | --- |
| 作品設計稿 1-2 張 | `design_board_1.jpg`, `design_board_2.jpg` | 已完成 |
| A3 橫式 | 4961 x 3508 像素 | 已驗證 |
| 300dpi JPG | `npm run validate:submission` 檢查 DPI | 已驗證 |
| 單張圖檔小於 5MB | `npm run validate:submission` 檢查大小 | 已驗證 |
| 作品去背圖 1 張 | `product_cutout.jpg` | 已完成 |
| 去背圖 300dpi JPG 小於 5MB | `product_cutout.jpg` | 已驗證 |
| 附件一參賽單位承諾書 | `attachment_1_commitment.pdf` | 待親筆簽名/蓋章 |
| 附件二著作授權同意書 | `attachment_2_copyright_authorization.pdf` | 待親筆簽名/蓋章 |
| 附件三個資提供同意書 | `attachment_3_personal_data_consent.pdf` | 已含簽名日期，送出前目視確認 |

## 使用者指定三項產品需求

| 需求 | 作品證據 | 驗證 |
| --- | --- | --- |
| 洗腎者佩戴裝置，上面需有時間、心率、血壓、跌倒偵測 | 3D 模型節點 `01_wearable_device_time_hr_bp_fall`、`wearable_time_display_tile`、`wearable_heart_rate_tile`、`wearable_blood_pressure_tile`、`wearable_fall_detection_tile`、互動畫面 `wearableScreen` | `npm run validate:glb`, `npm run validate:demo` |
| 床邊檢測器，確認活動狀態，必要時報警求救，方便看護對話聯繫 | 3D 模型節點 `02_bedside_activity_detector_alarm_call`、`bedside_activity_sensor_coverage_ring`、`bedside_alarm_siren_light`、`bedside_two_way_call_microphone`、`bedside_speaker_grille_for_voice_contact`、`SOS 求救`、`床邊通話 OPEN` | `npm run validate:glb`, `npm run validate:demo` |
| 居服員辦公室看板，顯示不同被照顧者即時健康指數，低於門檻須前往協助 | 3D 模型節點 `03_care_worker_office_health_index_dashboard`、三列個案健康指數節點、`office_low_health_threshold_line_40`、`office_dispatch_now_button`、`officeAlert`、`立即派員` | `npm run validate:glb`, `npm run validate:demo` |

## 評審重點對照

| 評審項目 | 腎安守護對應 |
| --- | --- |
| 通用設計原則 | 三端資訊同步、簡明健康指數、低門檻警示、患者無需複雜操作 |
| 智慧化 | 血壓、心率、活動量、跌倒偵測與健康指數整合 |
| 多元性 | 適用洗腎返家者、高齡者、家屬、看護與居服員辦公室 |
| 技術可行性 | Three.js 互動原型、GLB 3D 模型、Arduino 草稿與可重跑驗證腳本 |
| 概念創意 | 聚焦透析後返家與居家恢復期的照護空白 |

## 驗證指令

```bash
npm run validate:glb
npm run validate:demo
npm run validate:runtime
npm run validate:submission
npm run build
```

目前上述指令皆通過；`validate:submission` 僅保留附件一、附件二符合未簽名 SHA-256 基準的提醒。
驗證器會用目前未簽名附件一、二的 SHA-256 指紋作為基準；簽名後替換 PDF 並重新打包，未簽名基準提醒應消失。

## 優先上傳檔案

正式整包上傳優先使用：

```text
submission/renal_guardian_submission.zip
```

若平台要求分項上傳，優先使用：

```text
submission/platform_upload_files/
```

此資料夾已依上傳順序放好 6 個必傳檔案，並附 `optional_supplemental/` 補充資料。

## 剩餘人工關卡

附件一與附件二需參賽者親筆簽名或蓋章。簽名後使用：

```bash
npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf
npm run validate:submission
```

簽名前可直接使用：

```text
submission/signing_packet/
```

或壓縮備份：

```text
submission/signing_packet.zip
```
