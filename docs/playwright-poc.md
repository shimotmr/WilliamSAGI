# Playwright POC：前端自動化驗收流程

## 目的

把報告 #1313 的結論落地成可直接執行的 E2E 驗收流程，先用 `Hub / 新增任務` 作為 POC 樣板。

這個選點是對的，因為它同時涵蓋：

1. 真實 UI 操作
2. 多步驟表單
3. 前端狀態切換
4. API request 驗證
5. 最後成功訊息驗證

但又不必綁死 Supabase 真資料，避免測試被外部環境拖死。

## 實作內容

- `playwright.config.ts`
  - 自動啟動 Next.js dev server
  - 預設測 `http://127.0.0.1:3000`
  - 失敗時保留 trace / screenshot / video
- `tests/e2e/new-task.spec.ts`
  - 覆蓋三步驟流程：輸入描述 → 回答問題 → 確認派發
  - mock `/api/new-task/submit`
  - 驗證 request payload 與成功畫面
- `src/app/hub/new-task/page.tsx`
  - 補 `data-testid`，讓 selector 穩定

## 執行方式

```bash
cd /Users/travis/WilliamSAGI
npm run test:e2e
```

若首次執行缺瀏覽器：

```bash
npx playwright install chromium
```

## 為什麼要 mock submit API

`/api/new-task/submit` 目前依賴：

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `board_tasks` 寫入成功

直接打真資料庫不是不能做，但那是整合測試，不是前端驗收 smoke test。

前端驗收的第一步應該先確認：

- 畫面能不能操作
- 狀態有沒有正確切換
- 送出的 payload 對不對
- 成功訊息有沒有顯示

這樣失敗訊號才乾淨。

## 建議整合策略（WilliamSAGI）

### 第一階段：現在就能上

針對每個新頁面至少補 1 個 Playwright smoke test：

- 頁面能開
- 主要 CTA 可點
- 核心流程至少走一遍

適合頁面：

- `/hub/new-task`
- `/hub/reports`
- `/hub/dashboard`
- `/hub/board`
- `/hub/openclaw-os`

### 第二階段：區分兩種測試

1. **UI smoke / workflow test**
   - mock API
   - 跑得快
   - 給 PR / pre-deploy 用

2. **integration test**
   - 接 staging API / staging DB
   - 驗證真資料流
   - 排程或部署前跑

### 第三階段：接進 CI

建議 GitHub Actions / Vercel 前置驗收加入：

```bash
npm run lint
npm run build
npm run test:e2e
```

## 風險與限制

1. `/hub/dashboard` 這類強依賴即時資料的頁面，如果不先 mock，會不穩。
2. 現在 selector 還不算全面，之後應持續補 `data-testid` 到高價值互動元件。
3. 目前只有 chromium；未來可擴 Firefox / WebKit，但先別搞太大。
4. 這份 POC 偏重功能驗收，不是視覺 regression。視覺比對要另外加 screenshot baseline。

## 結論

報告 #1313 的方向是對的，而且已經可以在 WilliamSAGI 實際落地。

最務實的做法不是一開始就追求整站全自動，而是：

- 先選高價值流程
- 先做可穩定執行的 smoke test
- 再逐步往 staging integration 與 visual regression 擴張

這份 POC 已經足夠當 WilliamSAGI 的 Playwright 樣板。後續照這個模式擴寫就行。
