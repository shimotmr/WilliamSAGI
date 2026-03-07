# WilliamSAGI 第六批重構說明

## 第六批重構的目的

第六批的核心目標，是補上頁面級 Layout / Shell 結構，讓 Portal、Hub、Dashboard 在視覺與結構上更一致，而不是每一頁自己重組容器與頁首。

這一批會新增：

- AppShell
- DashboardShell
- PortalShell

並把目前已拆過的頁面改接 Shell。

---

## 整理路徑

### 新增
- `src/components/layout/AppShell.tsx`
- `src/components/layout/DashboardShell.tsx`
- `src/components/layout/PortalShell.tsx`

### 覆蓋
- `src/app/hub/dashboard/page.tsx`
- `src/app/portal/page.tsx`

---

## 本批收益

1. 頁面容器與 spacing 統一  
2. Portal / Hub / Dashboard 有一致的 shell 結構  
3. 後續新增 analytics / reports / approvals 頁時可直接套用
