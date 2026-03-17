-- Migration: LINE Bot 知識訓練中心 v1
-- 日期: 2026-03-10
-- 說明: 建立群組政策、價格 tier、庫存模糊化結構

-- ============================================
-- 1. 群組政策表 (line_chat_policies)
-- ============================================

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

-- 索引
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_group_id ON line_chat_policies(group_id);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_tier ON line_chat_policies(tier);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_active ON line_chat_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_type ON line_chat_policies(group_type);

-- 更新時間觸發器
CREATE OR REPLACE FUNCTION update_line_chat_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_line_chat_policies_updated_at ON line_chat_policies;
CREATE TRIGGER trigger_update_line_chat_policies_updated_at
  BEFORE UPDATE ON line_chat_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_line_chat_policies_updated_at();

-- ============================================
-- 2. 價格 Tier 欄位 (products_full 擴充)
-- ============================================

-- 新增三個 tier 價格欄位
ALTER TABLE products_full 
ADD COLUMN IF NOT EXISTS dealer_price_a DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_b DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_c DECIMAL(12,2);

-- 索引（加速 tier 查詢）
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_a 
  ON products_full(dealer_price_a) 
  WHERE dealer_price_a IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_b 
  ON products_full(dealer_price_b) 
  WHERE dealer_price_b IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_c 
  ON products_full(dealer_price_c) 
  WHERE dealer_price_c IS NOT NULL;

-- 幣別欄位（如果不存在）
ALTER TABLE products_full 
ADD COLUMN IF NOT EXISTS dealer_price_currency VARCHAR(10) DEFAULT 'TWD';

-- ============================================
-- 3. 測試群組政策資料
-- ============================================

-- 測試群組（驗證台用）
INSERT INTO line_chat_policies (group_id, group_name, tier, can_show_price, can_show_inventory, group_type, notes)
VALUES 
  ('test-validation-group', '驗證台測試群組', 'A', true, true, 'test', '用於驗證台測試'),
  ('test-tier-b-group', 'Tier B 測試群組', 'B', true, true, 'test', 'Tier B 測試'),
  ('test-tier-c-group', 'Tier C 測試群組', 'C', false, false, 'test', 'Tier C 測試（無權限）')
ON CONFLICT (group_id) DO NOTHING;

-- ============================================
-- 4. 測試產品價格資料（如果需要）
-- ============================================

-- 為現有產品設定測試價格（三者同價，但流程依 tier 查詢）
UPDATE products_full
SET 
  dealer_price_a = list_price * 0.7,
  dealer_price_b = list_price * 0.75,
  dealer_price_c = list_price * 0.8,
  dealer_price_currency = currency
WHERE list_price IS NOT NULL
  AND dealer_price_a IS NULL;

-- ============================================
-- 5. 查詢日誌表（用於追蹤與分析）
-- ============================================

CREATE TABLE IF NOT EXISTS line_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  query_text TEXT NOT NULL,
  classification VARCHAR(50), -- price/inventory/knowledge/mixed
  
  -- 查詢結果
  matched_products JSONB,
  policy_tier CHAR(1),
  response_sent TEXT,
  
  -- 效能
  elapsed_ms INTEGER,
  
  -- 元資料
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_query_logs_group_id ON line_query_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_created_at ON line_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_classification ON line_query_logs(classification);

-- ============================================
-- 6. 視圖：安全產品視圖（排除成本）
-- ============================================

CREATE OR REPLACE VIEW products_safe AS
SELECT 
  id,
  aurotek_pn,
  pudu_pn,
  name,
  name_en,
  brand,
  list_price,
  currency,
  dealer_price_a,
  dealer_price_b,
  dealer_price_c,
  dealer_price_currency,
  material_type,
  is_active,
  created_at,
  updated_at
  -- 故意排除: cost, cost_currency, margin 等成本欄位
FROM products_full
WHERE is_active = true;

-- ============================================
-- 7. 視圖：庫存模糊化視圖
-- ============================================

CREATE OR REPLACE VIEW inventory_status_safe AS
SELECT 
  product_id,
  CASE 
    WHEN quantity = 0 THEN '無庫存'
    WHEN quantity <= 10 THEN '庫存緊張'
    ELSE '庫存充足'
  END as status,
  updated_at
  -- 故意排除: quantity, warehouse, expected_date 等明確資訊
FROM inventory;

-- ============================================
-- 8. RLS 政策（Row Level Security）
-- ============================================

-- 啟用 RLS
ALTER TABLE line_chat_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_query_logs ENABLE ROW LEVEL SECURITY;

-- 允許 service role 完整存取
CREATE POLICY "Service role full access on line_chat_policies"
  ON line_chat_policies
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on line_query_logs"
  ON line_query_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 9. 註解說明
-- ============================================

COMMENT ON TABLE line_chat_policies IS 'LINE 群組政策設定：定義每個群組的 tier 等級與權限';
COMMENT ON COLUMN line_chat_policies.tier IS '價格等級：A=最高級經銷商，B=一般經銷商，C=潛在客戶';
COMMENT ON COLUMN line_chat_policies.can_show_price IS '是否允許查詢價格（依 tier 決定可見價格）';
COMMENT ON COLUMN line_chat_policies.can_show_inventory IS '是否允許查詢庫存（只回模糊狀態）';

COMMENT ON TABLE line_query_logs IS 'LINE 查詢日誌：記錄所有查詢以供分析與審計';
COMMENT ON COLUMN line_query_logs.matched_products IS '命中的產品清單（JSON 格式，已排除成本欄位）';

COMMENT ON VIEW products_safe IS '安全產品視圖：排除所有成本相關欄位，用於對外查詢';
COMMENT ON VIEW inventory_status_safe IS '庫存模糊化視圖：只回傳狀態，不回傳明確數量';
