# 比賽規格對照稽核

稽核日期：2026-06-29  
比賽頁來源：https://bhuntr.com/tw/competitions/zh6ohdsql0rat0tq6j

## 比賽名稱

2026年ICARE身心障礙與高齡者輔具產品通用設計競賽

## 收件時間

2026-06-15 起至 2026-10-12 23:59 止。

## 報名資格重點

- 個人或團體皆可參賽。
- 團體每組至多四名組員及一名指導老師。
- 作品需未曾於國內外公開發表、展出、獲獎或接受補助。
- 檢附資料不可有隱匿、虛偽不實、抄襲、仿冒或侵害智慧財產權情事。

## 投稿檔案規格

| 平台要求 | 本作品對應檔案 | 驗證狀態 |
| --- | --- | --- |
| 作品設計稿圖檔 1-2 張 | `design_board_1.jpg`, `design_board_2.jpg` | 已備妥 |
| A3 橫式 / 300dpi / JPG | `design_board_1.jpg`, `design_board_2.jpg` | 4961 x 3508, 300dpi, JPG |
| 每張設計稿小於 5MB | `design_board_1.jpg`, `design_board_2.jpg` | 已通過驗證 |
| 作品去背圖檔 1 張 | `product_cutout.jpg` | 已備妥 |
| 去背圖 300dpi / JPG / 小於 5MB | `product_cutout.jpg` | 4961 x 3508, 300dpi, JPG |
| 參賽單位承諾書 | `attachment_1_commitment.pdf` | 需參賽者親筆簽名或蓋章 |
| 著作授權同意書 | `attachment_2_copyright_authorization.pdf` | 需參賽者親筆簽名或蓋章 |
| 個人資料提供同意書 | `attachment_3_personal_data_consent.pdf` | 已含簽名日期，送出前目視確認 |

補充檔：

- `product_cutout_transparent.png` 保留透明背景版本，供評審或後續簡報使用；正式平台規格以 `product_cutout.jpg` 為準。
- `renal_guardian_three_part_system.glb` 與 `demo_code.zip` 為額外補強交付物，展示 3D 模型與互動程式可行性。

## 評審標準對照

| 評審項目 | 比重 | 腎安守護回應方式 |
| --- | --- | --- |
| 通用設計原則 | 40% | 三端資訊同步、簡明狀態顯示、低門檻警示與照護者介入流程 |
| 智慧化 | 15% | 心率、血壓、跌倒、活動量與健康指數整合判斷 |
| 多元性 | 15% | 適用洗腎返家者、高齡者、家屬、看護與居服員辦公室 |
| 技術可行性 | 15% | 以現有穿戴感測、床邊感測、通話與網頁看板技術可組成 MVP |
| 概念創意 | 15% | 聚焦透析後返家高風險時段，補上醫療照護與家庭照護之間的空白 |

## 七大通用設計原則對照

- 平等使用：患者、家屬與照護團隊皆可透過不同端點取得同一風險狀態。
- 靈活運用：穿戴端、床邊端與辦公室端可依照照護場域分別使用。
- 簡單易用：使用健康指數、顏色與短狀態字呈現風險。
- 簡單訊息：時間、心率、血壓、跌倒、活動與派員狀態直接顯示。
- 容許差異：活動量、血壓、心率與跌倒偵測共同判斷，降低單一訊號誤判風險。
- 省力操作：患者不需主動回報即可被動監測；異常時照護者主動介入。
- 度量合宜：佩戴裝置、床邊檢測器與辦公室看板各自對應身體、居家與照護站距離。

## 最後人工關卡

附件一與附件二仍需參賽者親筆簽名或蓋章。附件三送出前需目視確認簽名與日期清楚。簽名完成後請執行：

```bash
npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf
npm run validate:submission
```
