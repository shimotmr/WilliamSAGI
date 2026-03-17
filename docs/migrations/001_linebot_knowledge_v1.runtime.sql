ALTER TABLE pudu_products 
ADD COLUMN IF NOT EXISTS dealer_price_a NUMERIC,
ADD COLUMN IF NOT EXISTS dealer_price_b NUMERIC,
ADD COLUMN IF NOT EXISTS dealer_price_c NUMERIC,
ADD COLUMN IF NOT EXISTS dealer_price_currency VARCHAR(10) DEFAULT 'TWD';

CREATE TABLE IF NOT EXISTS line_chat_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id VARCHAR(255) NOT NULL UNIQUE,
  group_name VARCHAR(255),
  tier CHAR(1) NOT NULL DEFAULT 'C' CHECK (tier IN ('A','B','C')),
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

CREATE INDEX IF NOT EXISTS idx_line_chat_policies_group_id ON line_chat_policies(group_id);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_group_id ON line_query_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_line_query_logs_created_at ON line_query_logs(created_at);

UPDATE pudu_products
SET 
  dealer_price_a = COALESCE(dealer_price_a, dealer_price, list_price),
  dealer_price_b = COALESCE(dealer_price_b, dealer_price, list_price),
  dealer_price_c = COALESCE(dealer_price_c, dealer_price, list_price),
  dealer_price_currency = COALESCE(dealer_price_currency, currency, 'TWD')
WHERE list_price IS NOT NULL OR dealer_price IS NOT NULL;

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

CREATE OR REPLACE VIEW products_safe AS
SELECT 
  p.id,
  p.aurotek_pn,
  p.pudu_pn,
  p.name,
  p.name_en,
  p.brand,
  p.list_price,
  p.currency,
  p.dealer_price_a,
  p.dealer_price_b,
  p.dealer_price_c,
  p.dealer_price_currency,
  p.material_type,
  p.spec,
  p.notes,
  p.is_active,
  p.updated_at
FROM pudu_products p
WHERE p.is_active = true;

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