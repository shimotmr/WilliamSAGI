# WilliamSAGI 重構落地檢查清單

## 合併順序建議
1. Batch 1
2. Batch 4
3. Batch 2
4. Batch 3
5. Batch 5
6. Batch 6
7. Batch 7

---

## 驗收清單

### Auth / Login
- [ ] JWT_SECRET 已設定
- [ ] login route 正常登入
- [ ] admin / user redirect 正常
- [ ] middleware RBAC 正常

### Dashboard
- [ ] dashboard API 正常回傳
- [ ] Token 圖表正常
- [ ] Agent 區塊正常
- [ ] Tasks 區塊正常

### Portal
- [ ] Portal 首頁可載入
- [ ] 使用者名稱顯示正常
- [ ] admin 模組顯示正常
- [ ] 非 admin 不顯示 system group

### UI / Layout
- [ ] PageHeader 正常
- [ ] SectionCard 正常
- [ ] ModuleCard 正常
- [ ] DashboardShell / PortalShell 正常

### Engineering
- [ ] `npm run lint` 通過
- [ ] `npx tsc --noEmit` 通過
- [ ] CI workflow 可跑
