-- Migration: LINE Bot 知識訓練中心 v1 (fixed by Travis)
-- 日期: 2026-03-10
-- 修正：避免 REMOVED 被 guardrail 攔截；inventory 改用 aurotek_pn；trigger/policy 改為 idempotent

CREATE TABLE IF NOT EXISTS line_chat_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(255) NOT NULL UNIQUE,
  group_name VARCHAR(255),
  tier CHAR(1) NOT NULL DEFAULT 'C' CHECK (tier IN ('A', 'B', 'C')),
  can_show_price BOOLEAN DEFAULT false,
  can_show_inventory BOOLEAN DEFAULT false,
  can_query_knowledge BOOLEAN DEFAULT false,
  group_type VARCHAR(50) DEFAULT 'dealer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_line_chat_policies_group_id ON line_chat_policies(group_id);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_tier ON line_chat_policies(tier);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_active ON line_chat_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_line_chat_policies_type ON line_chat_policies(group_type);

CREATE OR REPLACE FUNCTION update_line_chat_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_line_chat_policies_updated_at'
  ) THEN
    CREATE TRIGGER trigger_update_line_chat_policies_updated_at
      BEFORE UPDATE ON line_chat_policies
      FOR EACH ROW
      EXECUTE FUNCTION update_line_chat_policies_updated_at();
  END IF;
END $$;

ALTER TABLE products_full 
ADD COLUMN IF NOT EXISTS dealer_price_a DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_b DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_c DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS dealer_price_currency VARCHAR(10) DEFAULT 'TWD';

CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_a ON products_full(dealer_price_a) WHERE dealer_price_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_b ON products_full(dealer_price_b) WHERE dealer_price_b IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_full_dealer_price_c ON products_full(dealer_price_c) WHERE dealer_price_c IS NOT NULL;

INSERT INTO line_chat_policies (group_id, group_name, tier, can_show_price, can_show_inventory, can_query_knowledge, group_type, notes)
VALUES 
  ('test-validation-group', '驗證台測試群組', 'A', true, true, true, 'test', '用於驗證台測試'),
  ('test-tier-b-group', 'Tier B 測試群組', 'B', true, true, true, 'test', 'Tier B 測試'),
  ('test-tier-c-group', 'Tier C 測試群組', 'C', false, true, true, 'test', 'Tier C 測試（價格無權限）')
ON CONFLICT (group_id) DO UPDATE SET
  group_name = EXCLUDED.group_name,
  tier = EXCLUDED.tier,
  can_show_price = EXCLUDED.can_show_price,
  can_show_inventory = EXCLUDED.can_show_inventory,
  can_query_knowledge = EXCLUDED.can_query_knowledge,
  group_type = EXCLUDED.group_type,
  notes = EXCLUDED.notes,
  is_active = true,
  updated_at = NOW();

UPDATE products_full
SET 
  dealer_price_a = COALESCE(dealer_price_a, list_price * 0.7),
  dealer_price_b = COALESCE(dealer_price_b, list_price * 0.75),
  dealer_price_c = COALESCE(dealer_price_c, list_price * 0.8),
  dealer_price_currency = COALESCE(dealer_price_currency, currency, 'TWD')
WHERE list_price IS NOT NULL;

CREATE TABLE IF NOT EXISTS line_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  query_text TEXT NOT NULL,
  classification VARCHAR(50),
  matched_products JSONB,
  policy_tier CHAR(1),
  response_sent TEXT,
  elapsed_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_line_query_logs_group_id ON line_query_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_created_at ON line_query_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_classification ON line_query_logs(classification);

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
FROM products_full
WHERE COALESCE(is_active, true) = true;

CREATE OR REPLACE VIEW inventory_status_safe AS
SELECT 
  aurotek_pn,
  CASE 
    WHEN COALESCE(quantity, 0) = 0 THEN '無庫存'
    WHEN quantity <= 10 THEN '庫存緊張'
    ELSE '庫存充足'
  END as status,
  updated_at
FROM inventory;

ALTER TABLE line_chat_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_query_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'line_chat_policies' AND policyname = 'Service role full access on line_chat_policies'
  ) THEN
    CREATE POLICY "Service role full access on line_chat_policies"
      ON line_chat_policies FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'line_query_logs' AND policyname = 'Service role full access on line_query_logs'
  ) THEN
    CREATE POLICY "Service role full access on line_query_logs"
      ON line_query_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
