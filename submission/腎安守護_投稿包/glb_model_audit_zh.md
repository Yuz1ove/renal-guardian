# 腎安守護 3D 模型結構稽核

稽核日期：2026-06-29

## 目的

本文件用來證明 `renal_guardian_three_part_system.glb` 不只是示意檔，而是包含三端式照護系統關鍵設備與功能節點的 3D 模型。

## GLB 基本條件

- 格式：glTF 2.0 binary (`.glb`)
- 正式投稿檔名：`renal_guardian_three_part_system.glb`
- 中文原始檔名：`腎安守護-三端式照護系統.glb`
- 驗證指令：`npm run validate:glb`

## 必要節點

| GLB 節點名稱 | 對應意義 |
| --- | --- |
| `RenalGuardian_three_terminal_care_system` | 三端式照護系統總群組 |
| `01_wearable_device_time_hr_bp_fall` | 洗腎者佩戴裝置 |
| `02_bedside_activity_detector_alarm_call` | 床邊活動檢測、警報與通話裝置 |
| `03_care_worker_office_health_index_dashboard` | 居服員辦公室健康指數看板 |
| `screen_time_hr_bp_fall` | 穿戴端時間、心率、血壓、跌倒偵測畫面 |
| `wearable_time_display_tile` | 穿戴端時間顯示區 |
| `wearable_heart_rate_tile` | 穿戴端心率顯示區 |
| `wearable_blood_pressure_tile` | 穿戴端血壓顯示區 |
| `wearable_fall_detection_tile` | 穿戴端跌倒偵測狀態區 |
| `wearable_manual_sos_side_button` | 穿戴端手動求救側鍵 |
| `bedside_display_activity_call_sos` | 床邊端活動、通話與 SOS 顯示 |
| `bedside_activity_sensor_coverage_ring` | 床邊活動偵測覆蓋範圍 |
| `bedside_two_way_call_microphone` | 床邊雙向通話麥克風 |
| `bedside_speaker_grille_for_voice_contact` | 床邊雙向通話喇叭格柵 |
| `bedside_alarm_siren_light` | 床邊求救警示燈 |
| `low_health_index_dispatch_alert` | 辦公室端低健康指數派員警示 |
| `office_patient_hou_health_index_row` | 辦公室端侯冠宇健康指數列 |
| `office_patient_lin_health_index_row` | 辦公室端第二位照護者健康指數列 |
| `office_patient_chen_health_index_row` | 辦公室端第三位照護者健康指數列 |
| `office_low_health_threshold_line_40` | 辦公室端健康指數 40 派員門檻 |
| `office_dispatch_now_button` | 辦公室端立即派員按鈕 |
| `sos_alarm_button` | 床邊 SOS 警報按鈕 |

## 驗證標準

`scripts/validate-glb.mjs` 會檢查：

- GLB magic header 為 `glTF`。
- GLB 版本為 2.0。
- 檔案宣告長度與實際長度一致。
- JSON chunk 存在且可解析。
- 必要節點名稱完整存在。
- 至少包含 1 個 scene。
- 至少包含 40 個 mesh；目前匯出模型驗證為 47 個 mesh。
- 至少包含 6 個 material。
- 存在 binary geometry buffer。

## 投稿意義

此 GLB 支援評審檢視三個實體設備在同一照護系統中的關係：

1. 佩戴裝置負責個人生命徵象與跌倒偵測。
2. 床邊檢測器負責居家活動、警報與對話聯繫。
3. 辦公室看板負責多位被照顧者健康指數與派員決策。
