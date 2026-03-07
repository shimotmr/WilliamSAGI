# WilliamSAGI 架構路線圖

## 已完成重構主線

### Batch 1
- theme / auth / login 底座整理

### Batch 2
- dashboard 模組化
- 拆出 types / services / components

### Batch 3
- portal 模組化
- 拆出 types / hooks / services / components

### Batch 4
- 基礎設施層收斂
- Supabase / auth service / dashboard server service

### Batch 5
- 共用 UI primitives
- PageHeader / SectionCard / ModuleCard / EmptyState / StatusBadge

### Batch 6
- 頁面級 Shell / Layout
- PortalShell / DashboardShell / AppShell

### Batch 7
- roadmap / CI / checklist 收尾

---

## 建議最終目錄

```text
src/
  app/
  components/
    ui/
    layout/
  features/
    auth/
    dashboard/
    portal/
  lib/
    auth/
    supabase/
    theme/
    utils/
  styles/
```

---

## 後續可以再做但不屬於本輪必要項目

- React Query 真正導入 dashboard / portal
- 測試補齊（unit / component / API）
- Storybook 或 design preview
- analytics / reports / approvals / prompts / rules 頁面套用同一套 shell 與 UI
