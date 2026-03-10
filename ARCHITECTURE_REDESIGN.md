# WilliamSAGI 網站架構重設計

## 現況問題

### 1. 頁面氾濫
- 總頁面數: 116 頁
- 太多實驗性頁面未整理
- 重複頁面過多 (board/board2, dashboard/dashboard2)

### 2. 角色混雜
- Portal 區塊混合了: 產品、行銷、客戶、內部管理
- Hub 區塊混合了: 個人工作、團隊管理、系統監控

### 3. 資料完整性問題
- 同一資料多處存放
- 沒有明確的資料所有權

---

## 建議架構

### 三大區塊分離原則

```
WilliamSAGI
├── Portal (對外/內容)     ← 公開資訊、產品展示
├── Hub (控制中心)         ← 個人工作、任務管理  
├── Daily (每日報告)       ← 數據洞察、會議記錄
└── Admin (管理)          ← 系統設定、權限管理
```

---

### 重新分類

#### 1. Portal (對外)
| 保留 | 移除/合併 |
|------|----------|
| products | prototype |
| cases | slides (合併到 marketing) |
| knowledge | videos |
| marketing | |

#### 2. Hub (個人工作區)
| 保留 | 移除/合併 |
|------|----------|
| dashboard | dashboard2 → 合併 |
| board | board2 → 合併 |
| today | today2 → 合併 |
| trade | |
| reports | reports2 → 合併 |

#### 3. Daily (數據報告)
| 保留 | 移除/合併 |
|------|----------|
| reports | |
| meeting | |
| monitor | |

#### 4. 實驗性頁面
- 移至 /experimental 或移除
- 包含: tesla, wecom, warroom, rag-testing

---

## 角色權限設計

| 角色 | 可訪問 |
|------|--------|
| 訪客 | Portal 公開內容 |
| 員工 | Portal + Hub(個人) |
| 管理員 | Portal + Hub + Daily + Admin |

---

## 執行計劃

1. 合併重複頁面 (v1)
2. 建立 /experimental 收納實驗頁面 (v2)
3. 建立 Admin 區塊 (v3)
4. 清理未使用頁面 (v4)

