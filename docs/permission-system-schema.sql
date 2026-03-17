-- 雙系統權限管理架構資料庫 Schema
-- 實作日期: 2026-03-10

-- Hub 系統權限表
CREATE TABLE IF NOT EXISTS hub_permissions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'viewer')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hub 權限索引
CREATE INDEX IF NOT EXISTS idx_hub_permissions_email ON hub_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_hub_permissions_role ON hub_permissions(role);

-- Portal 系統權限表
CREATE TABLE IF NOT EXISTS portal_permissions (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user', 'dealer', 'viewer')),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portal 權限索引
CREATE INDEX IF NOT EXISTS idx_portal_permissions_email ON portal_permissions(user_email);
CREATE INDEX IF NOT EXISTS idx_portal_permissions_role ON portal_permissions(role);

-- 權限說明:
-- Hub 系統:
--   - admin: 完整管理權限（可管理其他用戶權限）
--   - user: 一般用戶（可訪問 Hub 功能）
--   - viewer: 唯讀用戶（僅能查看）
--
-- Portal 系統:
--   - admin: 完整管理權限（可管理其他用戶權限）
--   - user: 一般用戶（可訪問 Portal 功能）
--   - dealer: 經銷商用戶（可查看相關業務資料）
--   - viewer: 唯讀用戶（僅能查看）

-- 初始管理員資料（根據現有 portal_admins 設定）
-- 這些會在部署後手動插入或透過遷移腳本處理
