# LINE Bot 知識訓練中心與價格/庫存查詢驗證台 v1 規格文件

**版本**: 1.0  
**日期**: 2026-03-10  
**作者**: Blake (Builder Agent)

---

## 1. 系統概述

本系統為 LINE Bot 提供智慧查詢功能，支援：
- 產品價格查詢（依 tier 分級）
- 庫存狀態查詢（模糊化）
- 知識問答（未來 Phase）

核心設計原則：
1. **安全第一**: 成本欄位永不對外暴露
2. **分級授權**: tier A/B/C 綁定群組，整群採最低等級
3. **模糊化輸出**: 庫存只回狀態（0/低/正常），不回明確數量

---

## 2. 三大路由規則

### 2.1 價格查詢路由

**觸發條件**:
- 訊息含關鍵字: 「價格」「多少錢」「報價」「價錢」「售價」
- 或直接輸入料號（pudu_pn / aurotek_pn）

**處理流程**:
```
1. 解析訊息 → 提取料號或產品名稱
2. 查詢 products_full（用 pudu_pn / aurotek_pn / name 模糊匹配）
3. 取得群組 tier（從 line_chat_policies）
4. 依 tier 選擇價格欄位:
   - tier A → dealer_price_a
   - tier B → dealer_price_b
   - tier C → dealer_price_c
5. 檢查政策是否允許回覆價格（can_show_price）
6. 組裝回覆（不包含成本）
```

**輸出範例**:
```
✅ 產品: PUDU CC1
料號: PUDU-CC1
經銷價: NT$ 85,000
庫存: 充足
```

### 2.2 庫存查詢路由

**觸發條件**:
- 訊息含關鍵字: 「庫存」「現貨」「有貨」「庫餘」
- 或與價格查詢同時觸發

**處理流程**:
```
1. 解析訊息 → 提取料號
2. 查詢 inventory 表
3. 套用三段式規則:
   - qty = 0 → "無庫存"
   - qty <= 10 → "庫存緊張"
   - qty > 10 → "庫存充足"
4. 檢查政策是否允許回覆庫存（can_show_inventory）
5. 組裝回覆（只回模糊狀態）
```

**輸出範例**:
```
📦 PUDU CC1 庫存狀態: 庫存緊張
（建議儘快下單）
```

### 2.3 知識查詢路由（未來 Phase）

**Phase 1** (v1.5):
- 靜態 FAQ 查詢
- 關鍵字匹配
- 產品規格查詢

**Phase 2** (v2.0):
- 動態知識庫（向量搜尋）
- 產品手冊檢索
- 故障排除指南

**Phase 3** (v3.0):
- AI 問答（RAG）
- 多輪對話
- 個性化推薦

---

## 3. 群組政策結構 (line_chat_policies)

### 3.1 資料表定義

```sql
CREATE TABLE IF NOT EXISTS line_chat_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(255) NOT NULL UNIQUE,
  group_name VARCHAR(255),
  
  -- Tier 等級（A=最高，C=最低）
  tier CHAR(1) NOT NULL DEFAULT 'C' CHECK (tier IN ('A', 'B', 'C')),
  
  -- 權限控制
  can_show_price BOOLEAN DEFAULT false,
  can_show_inventory BOOLEAN DEFAULT false,
  can_query_knowledge BOOLEAN DEFAULT false,
  
  -- 群組類型
  group_type VARCHAR(50) DEFAULT 'dealer', -- dealer/internal/vip/test
  
  -- 元資料
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  
  -- 備註
  notes TEXT
);

CREATE INDEX idx_line_chat_policies_group_id ON line_chat_policies(group_id);
CREATE INDEX idx_line_chat_policies_tier ON line_chat_policies(tier);
CREATE INDEX idx_line_chat_policies_active ON line_chat_policies(is_active);
```

### 3.2 Tier 策略說明

**整群最低等級原則**:
- 當群組內有多個用戶時，系統取該群組中**最低** tier 作為整群 tier
- 例如: 群組內有 A 級和 B 級用戶 → 整群採用 B 級

**Tier 定義**:
| Tier | 說明 | 可見價格 | 典型對象 |
|------|------|---------|---------|
| A | 最高級經銷商 | dealer_price_a | 核心經銷商、戰略夥伴 |
| B | 一般經銷商 | dealer_price_b | 一般經銷商 |
| C | 潛在客戶 | dealer_price_c | 詢價客戶、新客戶 |

### 3.3 政策優先順序

```
1. 群組政策 (line_chat_policies)
   ↓
2. 預設政策（tier C，不可見價格/庫存）
```

---

## 4. 價格 Tier 結構

### 4.1 products_full 擴充欄位

```sql
-- 新增三個 tier 價格欄位
ALTER TABLE products_full 
ADD COLUMN IF NOT EXISTS dealer_price_a DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_b DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_c DECIMAL(12,2);

-- 索引（加速查詢）
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_a ON products_full(dealer_price_a) WHERE dealer_price_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_b ON products_full(dealer_price_b) WHERE dealer_price_b IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_c ON products_full(dealer_price_c) WHERE dealer_price_c IS NOT NULL;
```

### 4.2 價格查詢邏輯

```typescript
function getPriceByTier(product: Product, tier: 'A' | 'B' | 'C'): number | null {
  const priceMap = {
    'A': product.dealer_price_a,
    'B': product.dealer_price_b,
    'C': product.dealer_price_c,
  }
  return priceMap[tier]
}
```

### 4.3 安全規則

**永遠不暴露的欄位**:
- `cost` 成本
- `cost_currency` 成本幣別
- `margin` 毛利率
- 任何內部成本相關資訊

**可暴露的欄位**:
- `list_price` 定價（公開資訊）
- `dealer_price_a/b/c` 經銷價（依 tier 授權）

---

## 5. 庫存模糊化規則

### 5.1 三段式規則

```typescript
function getInventoryStatus(qty: number): string {
  if (qty === 0) return '無庫存'
  if (qty <= 10) return '庫存緊張'
  return '庫存充足'
}
```

### 5.2 庫存查詢 SQL

```sql
SELECT 
  product_id,
  CASE 
    WHEN quantity = 0 THEN '無庫存'
    WHEN quantity <= 10 THEN '庫存緊張'
    ELSE '庫存充足'
  END as status
FROM inventory
WHERE product_id = ?
```

**禁止**:
- 回傳明確數量
- 回傳預計到貨日期
- 回傳倉庫位置

---

## 6. 未來知識訓練中心範圍

### Phase 1: 靜態 FAQ (v1.5)
- [ ] 建立 line_knowledge_base 表
- [ ] 關鍵字匹配引擎
- [ ] 產品規格查詢
- [ ] 常見問題回答

### Phase 2: 向量搜尋 (v2.0)
- [ ] 整合 pgvector
- [ ] 產品手冊嵌入
- [ ] 語意搜尋
- [ ] 故障排除指南

### Phase 3: AI 問答 (v3.0)
- [ ] RAG 系統
- [ ] 多輪對話
- [ ] 個性化推薦
- [ ] 情感分析

---

## 7. API 端點規劃

### 7.1 驗證台 API

**POST /api/portal/linebot-validation/query**

Request:
```json
{
  "query": "PUDU CC1 價格",
  "group_id": "test-group-001"
}
```

Response:
```json
{
  "classification": "price",
  "products": [...],
  "policy": {
    "tier": "A",
    "can_show_price": true,
    "can_show_inventory": true
  },
  "inventory_status": "庫存充足",
  "final_response": "✅ 產品: PUDU CC1\n經銷價: NT$ 85,000\n庫存: 充足",
  "elapsed_ms": 234
}
```

### 7.2 LINE Webhook 擴充

**POST /api/line/webhook**

新增處理邏輯:
1. 解析訊息類型（價格/庫存/知識）
2. 查詢群組政策
3. 執行對應路由
4. 組裝安全回覆

---

## 8. 安全檢核清單

- [x] 成本欄位永不暴露
- [x] 庫存只回模糊狀態
- [x] 價格依 tier 授權
- [x] 群組政策優先於預設
- [x] 驗證台 debug 輸出排除成本欄位
- [ ] LINE webhook 需驗證簽章
- [ ] 敏感操作需記錄日誌

---

## 9. 測試案例

### 9.1 價格查詢測試

| 輸入 | 群組 Tier | 預期輸出 |
|------|----------|---------|
| "PUDU CC1 價格" | A | dealer_price_a |
| "PUDU CC1 多少錢" | B | dealer_price_b |
| "PUDU-CC1" | C | dealer_price_c |
| "PUDU CC1 價格" | C (無權限) | "無法提供價格資訊" |

### 9.2 庫存查詢測試

| 實際庫存 | 預期輸出 |
|---------|---------|
| 0 | "無庫存" |
| 5 | "庫存緊張" |
| 50 | "庫存充足" |

### 9.3 混合查詢測試

| 輸入 | 預期分類 |
|------|---------|
| "PUDU CC1 價格庫存" | mixed (price+inventory) |
| "PUDU CC1 規格" | knowledge (Phase 1) |

---

## 10. 部署檢核

- [ ] 執行 SQL migration
- [ ] 設定環境變數
- [ ] 建立 line_chat_policies 初始資料
- [ ] 設定 products_full tier 價格
- [ ] 測試驗證台頁面
- [ ] 測試 LINE webhook
- [ ] 檢查成本欄位是否完全排除

---

**文件版本歷史**:
- v1.0 (2026-03-10): 初版，定義核心路由與結構
