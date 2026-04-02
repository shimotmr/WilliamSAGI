# WilliamSAGI — William's Super AGI Hub

統一入口，整合三個服務：

| 路由 | 來源 | 說明 |
|------|------|------|
| `/` | William Hub | 入口首頁 |
| `/daily/*` | travis-daily | 個人專欄（公開） |
| `/portal/*` | aurotek-sales-portal | 和椿業務系統（需登入） |
| `/hub/*` | william-hub | AI 儀表板（William only） |
| `/api/line/webhook` | aurotek-sales-portal | LINE Bot webhook |

## 舊 Repo（保留，不刪除）
- https://github.com/shimotmr/William-hub
- https://github.com/shimotmr/travis-daily
- https://github.com/shimotmr/aurotek-sales-portal

## 部署
Vercel → 連結此 repo → 設定環境變數（參考 .env.example）

## Codex Phase 2

`/codex` 頁面在 Phase 2 會直接連本機 `codex app-server` WebSocket。

- 預設 URL：`ws://127.0.0.1:8765`
- 啟動腳本：`scripts/codex-app-server.sh`
- 維運說明：`docs/codex-app-server.md`
