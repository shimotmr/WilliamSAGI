# WilliamSAGI Design System

此目錄存放 Pencil 設計檔和設計規格。

## 目錄結構

```
design/
├── README.md                    # 本文件
├── sagi-full-spec.md           # 完整網站設計規格
├── sagi-dashboard-spec.md      # Dashboard 設計規格
└── *.pen                        # Pencil 設計檔
```

## 設計規格

### sagi-full-spec.md
完整的設計系統文件，包含：
- 網站架構（Hub/Portal/Demo）
- 顏色系統、字體系統
- 間距/圓角/陰影
- 共用元件規格
- 頁面模板
- 響應式規則

## Pencil 工作流程

1. 用 Pencil.dev 開啟 `.pen` 檔案
2. 設計/修改
3. 用 MCP 生成 React 程式碼
4. 測試無誤後 commit

## 顏色速查

| 用途 | 色碼 |
|------|------|
| 背景 | #050506 |
| 主色 | #5E6AD2 |
| 成功 | #4ade80 |
| 警告 | #fbbf24 |
| 錯誤 | #f87171 |
| 文字 | #EDEDEF |

## 響應式斷點

- 手機: < 640px
- 平板: 640-1023px
- 桌面: >= 1024px
