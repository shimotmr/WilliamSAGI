# Codex App Server

## 啟動方式

Phase 2 採用 `launchd + wrapper script`。

原因：

- `launchd` 適合 macOS 常駐服務，登入後自動啟動，crash 也能自動拉起。
- `scripts/codex-app-server.sh` 把實際執行路徑與 port 集中管理，版本升級時只需要改一個地方。
- 目前 `/opt/homebrew/bin/codex app-server` 在這台機器會先走 labide shim，無法可靠啟動 WebSocket listener；wrapper 直接呼叫 `@openai/codex/bin/codex.js`，可避開這個問題。

## 預設 Listen URL

`ws://127.0.0.1:8765`

`codex app-server --help` 顯示 app-server 以 `--listen <URL>` 指定 transport endpoint，支援 `stdio://` 與 `ws://IP:PORT`。

## 手動啟動

```bash
CODEX_APP_SERVER_LISTEN_URL=ws://127.0.0.1:8765 \
./scripts/codex-app-server.sh
```

## launchd 安裝

1. 複製模板：

```bash
cp launchd/com.williamhsiao.codex-app-server.plist.template ~/Library/LaunchAgents/com.williamhsiao.codex-app-server.plist
```

2. 把 `__PROJECT_ROOT__` 換成專案絕對路徑：

```bash
perl -0pi -e 's#__PROJECT_ROOT__#/Users/travis/WilliamSAGI#g' ~/Library/LaunchAgents/com.williamhsiao.codex-app-server.plist
```

3. 載入服務：

```bash
launchctl unload ~/Library/LaunchAgents/com.williamhsiao.codex-app-server.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.williamhsiao.codex-app-server.plist
launchctl start com.williamhsiao.codex-app-server
```

4. 查看狀態：

```bash
launchctl list | rg codex-app-server
tail -f /tmp/codex-app-server.log
tail -f /tmp/codex-app-server.error.log
```

## 前端設定

`.env.local` 至少需要：

```bash
NEXT_PUBLIC_CODEX_APP_SERVER_URL=ws://127.0.0.1:8765
```
