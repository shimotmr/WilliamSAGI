-- Paper Trading Tables for SAGI
-- 模擬交易系統：帳戶、持倉、委託記錄

CREATE TABLE IF NOT EXISTS paper_account (
  id TEXT PRIMARY KEY DEFAULT 'default',
  balance NUMERIC NOT NULL DEFAULT 10000000,
  initial_balance NUMERIC NOT NULL DEFAULT 10000000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL UNIQUE,
  symbol_name TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  avg_cost NUMERIC NOT NULL DEFAULT 0,
  current_price NUMERIC NOT NULL DEFAULT 0,
  market_value NUMERIC NOT NULL DEFAULT 0,
  cost_basis NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl_percent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS paper_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  symbol_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL CHECK (action IN ('buy', 'sell')),
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  share_type TEXT NOT NULL DEFAULT 'lot',
  amount NUMERIC NOT NULL DEFAULT 0,
  commission NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'filled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize default account
INSERT INTO paper_account (id, balance, initial_balance)
VALUES ('default', 10000000, 10000000)
ON CONFLICT (id) DO NOTHING;

-- RLS policies (allow all for now — this is a personal tool)
ALTER TABLE paper_account ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paper_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paper_account_all" ON paper_account FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "paper_positions_all" ON paper_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "paper_orders_all" ON paper_orders FOR ALL USING (true) WITH CHECK (true);
