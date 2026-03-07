# WilliamSAGI 第五批重構說明

## 第五批重構的目的

第五批的核心目標，是把目前 dashboard / portal / login 中仍然散落的共用 UI 視覺結構，收斂成真正可複用的 design-system 元件。

這一批處理的是：

- Page 標題列
- Section 區塊卡片
- Status Badge
- Module Card
- Empty State

這些元件是後續 Portal、Hub、Dashboard、報表頁與管理頁的共用視覺骨架。

---

## 第五批整理的路徑

### 新增
- `src/components/ui/PageHeader.tsx`
- `src/components/ui/SectionCard.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/ModuleCard.tsx`
- `src/components/ui/EmptyState.tsx`

### 覆蓋
- `src/features/portal/components/PortalModuleGrid.tsx`
- `src/app/hub/dashboard/page.tsx`

---

## 本批收益

1. Portal / Hub 的視覺骨架統一  
2. 共用元件真正落地，而不是只停留在 token 層  
3. 後續要新增頁面，不需要每次重新設計卡片與 header  
4. 可以讓後面第六批的頁面整體收斂更快完成

---

## 下一步
第六批會把目前已重構的頁面真正統一接到這批共用 UI primitives 上，並補上 Shell / Layout 結構。
