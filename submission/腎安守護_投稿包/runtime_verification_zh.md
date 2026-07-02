# 腎安守護執行驗證紀錄

驗證日期：2026-06-29

## 本機預覽狀態

預設本機預覽網址為：

```text
http://127.0.0.1:5173/
```

若 5173 被其他專案佔用，可改用：

```text
http://127.0.0.1:5174/
```

目前可重跑的自動化瀏覽器驗證會自行啟動 Vite 到臨時 `5175` 埠，不依賴既有開啟中的 5173 或 5174 server。

## 已執行驗證

### 投稿包驗證

```bash
npm run package:submission
npm run validate:submission
npm run validate:glb
npm run validate:demo
npm run validate:runtime
```

結果：通過，僅保留附件一、附件二符合未簽名 SHA-256 基準、需參賽者親筆簽名或蓋章的提醒；附件三需送出前目視確認簽名與日期。

### 正式建置驗證

```bash
npm run build
```

結果：通過。Vite 顯示 JavaScript chunk 大於 500KB 的提醒，此為 Three.js 打包後的體積提醒，不影響執行或投稿檔案。

### 真瀏覽器互動驗證

手動 Playwright 抽查曾使用：

```text
http://127.0.0.1:5174/
```

可重跑的 `npm run validate:runtime` 會自行啟動臨時 `5175` 埠並執行同一互動流程。

確認結果：

- 頁面標題為 `腎安守護 | 3D Design Prototype`。
- 頁面包含「腎安守護」作品名稱。
- 控制項包含收縮壓、心率、活動指數與跌倒偵測。
- 初始健康指數為 81，狀態為「穩定」。
- 居服員辦公室看板顯示多位被照顧者。
- 將跌倒偵測滑桿切到 1 後：
  - 跌倒狀態顯示「已偵測」。
  - 健康指數降為 20。
  - 狀態變為「立即協助」。
  - 辦公室看板提示派員並開啟床邊通話。

此流程已整理成可重跑指令：

```bash
npm run validate:runtime
```

## 截圖紀錄

本機驗證截圖位於：

- `output/playwright/renal_guardian_preview_5174.png`
- `output/playwright/renal_guardian_fall_alert_5174.png`

截圖為本機驗證用途，不列為正式平台必傳檔案。
