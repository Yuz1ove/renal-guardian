腎安守護附件簽名交接包

1. 開啟或列印 01_print_and_sign_attachment_1.pdf，參考 02_attachment_1_signature_position_guide.png/pdf，在附件一底部親筆簽名或蓋章。
2. 開啟或列印 03_print_and_sign_attachment_2.pdf，參考 04_attachment_2_signature_position_guide.png/pdf，在附件二授權人/簽名欄親筆簽名或蓋章。
3. 05_review_attachment_3_personal_data_consent.pdf 目前含簽名與日期；請參考 06_attachment_3_signature_date_guide.png/pdf 目視確認清楚可讀，必要時重新簽名掃描。
4. 將完成簽名的附件掃描或匯出成 PDF。
5. 回到專案根目錄執行，例如：

   npm run package:submission -- --attachment1 /path/to/signed_attachment_1.pdf --attachment2 /path/to/signed_attachment_2.pdf

若附件三也重新掃描，可加上：

   --attachment3 /path/to/signed_attachment_3.pdf

6. 驗證投稿包：

   npm run validate:submission

注意：不要用打字或圖片代簽；需要簽名處均須由參賽者本人親筆簽名或蓋章。
