# 腎安守護平台上傳指南

本文件用來在獎金獵人平台送件時逐項核對，避免正式上傳時選錯檔案。

## 基本資料欄位

| 平台欄位 | 建議填寫內容 |
| --- | --- |
| 作品名稱 | 腎安守護 |
| 團隊名稱 | 腎安守護 |
| 指導老師 | 無 |
| 姓名 / 代表人 | 侯冠宇 |
| 聯絡電話 | 0975259336 |
| 聯絡信箱 | kuanyunimo@gmail.com |
| 地址 | 台南市東區長東街108巷32號 |
| 學校 / 單位 | 台南市立家齊高中 |

## 作品摘要

洗腎患者真正危險的時刻，不只是在透析室，而是在離開透析室後的返家與居家恢復期。本系統補上醫療照護與家庭照護之間的空白，讓患者、家屬與照護團隊能在風險發生前採取行動。

## 分項上傳檔案

若平台要求逐項上傳，請優先使用 `submission/platform_upload_files/` 內已排序的檔案；檔名前方數字代表建議上傳順序。

| 平台要求 | 應選檔案 | 備註 |
| --- | --- | --- |
| 作品設計稿圖檔 1 | `01_design_board_1.jpg` | A3 橫式、300dpi、JPG、小於 5MB |
| 作品設計稿圖檔 2 | `02_design_board_2.jpg` | A3 橫式、300dpi、JPG、小於 5MB |
| 作品去背圖檔 | `03_product_cutout.jpg` | 正式規格檔，300dpi、JPG、小於 5MB |
| 參賽單位承諾書 | `04_attachment_1_commitment.pdf` | 送出前必須確認已親筆簽名或蓋章 |
| 著作授權同意書 | `05_attachment_2_copyright_authorization.pdf` | 送出前必須確認已親筆簽名或蓋章 |
| 個人資料提供同意書 | `06_attachment_3_personal_data_consent.pdf` | 目前含簽名與日期，送出前目視確認 |

## 補充檔案

若平台可上傳補充資料，或評審需要更多技術證明，可另外提供：

| 補充用途 | 檔案 |
| --- | --- |
| 透明背景產品圖 | `product_cutout_transparent.png` |
| 3D 模型 | `renal_guardian_three_part_system.glb` |
| 示範程式碼 | `demo_code.zip` |
| 兩頁作品說明 | `renal_guardian_brief.pdf` |
| 評審文字素材 | `judging_copy_zh.txt` |
| 技術規格 | `technical_specification_zh.md` |
| 原始需求對照 | `requirements_traceability_zh.md` |
| 比賽規格對照 | `competition_requirements_zh.md` |

在 `submission/platform_upload_files/optional_supplemental/` 內也已放好 3D 模型、示範程式、兩頁說明與最終審查矩陣。

## 整包上傳

若平台允許上傳 ZIP 或需要一次提供完整資料，優先使用：

```text
submission/renal_guardian_submission.zip
```

若平台要求分項上傳但你想先壓縮保存分項檔案，可使用：

```text
submission/platform_upload_files.zip
```

若評審端偏好中文檔名，可使用備份包：

```text
submission/腎安守護_投稿包.zip
```

## 送出前最後檢查

- 作品名稱與團隊名稱都是「腎安守護」。
- 指導老師欄填「無」或依平台規則留空。
- 信箱為 `kuanyunimo@gmail.com`。
- 地址為「台南市東區長東街108巷32號」。
- 去背圖正式上傳 `03_product_cutout.jpg`；若使用完整投稿包則對應 `product_cutout.jpg`，不是透明 PNG。
- 附件一已由參賽者本人親筆簽名或蓋章。
- 附件二已由參賽者本人親筆簽名或蓋章。
- 附件三簽名與日期清楚可讀。
- 送出後確認收到獎金獵人投稿成功通知信。
