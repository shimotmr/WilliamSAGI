'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './board.css';

// ============== Types ==============
interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface BundleCard {
  id: string;
  categoryId: string;
  title: string;
  sender: string;
  preview: string;
  position: number;
  createdAt: string;
  movedAt?: string;
  messages: Message[];
}

interface Category {
  id: string;
  name: string;
  color: string;
  position: number;
}

// ============== Components ==============

function BundleCardComponent({ 
  card, 
  isExpanded, 
  onToggle 
}: { 
  card: BundleCard; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'bundle', card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString('zh-TW', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bundle-card ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="bundle-header" onClick={onToggle}>
        <div className="bundle-title-row">
          <span className="bundle-icon">💬</span>
          <span className="bundle-title">{card.title}</span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <div className="bundle-meta">
          <span className="sender">👤 {card.sender}</span>
          <span className="message-count">💬 {card.messages?.length || 0}</span>
        </div>
        <p className="bundle-preview">{card.preview}</p>
      </div>
      
      {isExpanded && (
        <div className="timeline">
          <div className="timeline-header">
            <span>📜 訊息時間軸</span>
          </div>
          <div className="timeline-items">
            {card.messages?.map((msg) => (
              <div key={msg.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-sender">{msg.sender}</span>
                    <span className="timeline-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="timeline-text">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="audit-records">
            <div className="audit-header">📋 審計紀錄</div>
            <div className="audit-item">
              <span className="audit-action">建立</span>
              <span className="audit-time">{formatTime(card.createdAt || card.messages?.[0]?.timestamp)}</span>
            </div>
            {card.movedAt && (
              <div className="audit-item">
                <span className="audit-action">移動</span>
                <span className="audit-time">{formatTime(card.movedAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ 
  category, 
  cards 
}: { 
  category: Category; 
  cards: BundleCard[];
}) {
  const messageCount = cards.reduce((sum, card) => sum + (card.messages?.length || 0), 0);
  const lastActivity = cards.reduce((latest: string | null, card) => {
    const cardLast = card.messages?.[card.messages.length - 1]?.timestamp;
    if (!cardLast) return latest;
    return !latest || new Date(cardLast) > new Date(latest) ? cardLast : latest;
  }, null);

  const formatTime = (ts: string | null) => {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString('zh-TW', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="summary-card" style={{ borderLeftColor: category.color }}>
      <div className="summary-header">
        <span className="summary-icon">📊</span>
        <span className="summary-title">{category.name}</span>
        <span className="summary-badge" style={{ backgroundColor: category.color }}>
          {cards.length}
        </span>
      </div>
      <div className="summary-stats">
        <div className="stat">
          <span className="stat-label">訊息數</span>
          <span className="stat-value">{messageCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">最後活動</span>
          <span className="stat-value">{formatTime(lastActivity)}</span>
        </div>
      </div>
      <div className="summary-preview">
        {cards.slice(0, 2).map(card => (
          <div key={card.id} className="preview-item">
            • {card.title}
          </div>
        ))}
        {cards.length > 2 && <div className="preview-more">+{cards.length - 2} 更多...</div>}
      </div>
    </div>
  );
}

function Column({ 
  category, 
  cards, 
  expandedCardId, 
  onToggleCard, 
  searchTerm,
  categoryId
}: { 
  category: Category; 
  cards: BundleCard[];
  expandedCardId: string | null;
  onToggleCard: (id: string) => void;
  searchTerm: string;
  categoryId: string;
}) {
  const cardIds = cards.map(c => c.id);
  
  const filteredCards = cards.filter(card => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      card.title?.toLowerCase().includes(term) ||
      card.sender?.toLowerCase().includes(term) ||
      card.preview?.toLowerCase().includes(term) ||
      card.messages?.some(m => m.content?.toLowerCase().includes(term))
    );
  });

  const totalMessages = filteredCards.reduce((sum, c) => sum + (c.messages?.length || 0), 0);

  return (
    <div className="column" data-category-id={categoryId}>
      <div className="column-header" style={{ borderBottomColor: category.color }}>
        <div className="column-title">
          <span className="column-color" style={{ backgroundColor: category.color }}></span>
          <h3>{category.name}</h3>
          <span className="column-count">{filteredCards.length}</span>
        </div>
        <div className="column-stats">
          💬 {totalMessages}
        </div>
      </div>
      
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="column-content">
          {filteredCards.map(card => (
            <BundleCardComponent
              key={card.id}
              card={card}
              isExpanded={expandedCardId === card.id}
              onToggle={() => onToggleCard(card.id)}
            />
          ))}
          {filteredCards.length === 0 && (
            <div className="empty-column">無卡片</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function DragOverlayCard({ card }: { card: BundleCard }) {
  return (
    <div className="bundle-card dragging-overlay">
      <div className="bundle-header">
        <div className="bundle-title-row">
          <span className="bundle-icon">💬</span>
          <span className="bundle-title">{card.title}</span>
        </div>
        <div className="bundle-meta">
          <span className="sender">👤 {card.sender}</span>
        </div>
      </div>
    </div>
  );
}

// ============== Main Page ==============

const initialCategories: Category[] = [
  { id: 'cat-1', name: '待處理', color: '#ef4444', position: 0 },
  { id: 'cat-2', name: '處理中', color: '#f59e0b', position: 1 },
  { id: 'cat-3', name: '已完成', color: '#22c55e', position: 2 },
];

const initialCards: BundleCard[] = [
  {
    id: 'bundle-1',
    categoryId: 'cat-1',
    title: '產品報價請求',
    sender: '王經理',
    preview: '需要提供 XYZ 系列的報價單，數量 100 台',
    position: 0,
    createdAt: '2024-01-15T09:30:00Z',
    messages: [
      { id: 'msg-1', content: '您好，我們需要 XYZ 系列的報價，數量 100 台', sender: '王經理', timestamp: '2024-01-15T09:30:00Z' },
      { id: 'msg-2', content: '請問交期多久？', sender: '王經理', timestamp: '2024-01-15T09:35:00Z' },
      { id: 'msg-3', content: '交期大約 2 週', sender: '我方', timestamp: '2024-01-15T10:00:00Z' },
    ]
  },
  {
    id: 'bundle-2',
    categoryId: 'cat-1',
    title: '技術支援需求',
    sender: '李小姐',
    preview: '設備異常需要協助排查，錯誤碼 E-001',
    position: 1,
    createdAt: '2024-01-15T10:00:00Z',
    messages: [
      { id: 'msg-4', content: '機器出現錯誤碼 E-001', sender: '李小姐', timestamp: '2024-01-15T10:00:00Z' },
    ]
  },
  {
    id: 'bundle-3',
    categoryId: 'cat-2',
    title: '訂單確認',
    sender: '張總',
    preview: '訂單 #12345 確認事項',
    position: 0,
    createdAt: '2024-01-14T14:00:00Z',
    movedAt: '2024-01-15T08:00:00Z',
    messages: [
      { id: 'msg-5', content: '請確認訂單內容無誤', sender: '張總', timestamp: '2024-01-14T14:00:00Z' },
      { id: 'msg-6', content: '已確認，金額正確', sender: '我方', timestamp: '2024-01-14T15:00:00Z' },
    ]
  },
  {
    id: 'bundle-4',
    categoryId: 'cat-3',
    title: '年度合約討論',
    sender: '陳董',
    preview: '2024 年度合作方案已完成',
    position: 0,
    createdAt: '2024-01-10T11:00:00Z',
    movedAt: '2024-01-12T09:00:00Z',
    messages: [
      { id: 'msg-7', content: '期待與貴公司合作', sender: '陳董', timestamp: '2024-01-10T11:00:00Z' },
      { id: 'msg-8', content: '合約已寄出', sender: '我方', timestamp: '2024-01-10T16:00:00Z' },
      { id: 'msg-9', content: '已簽回', sender: '陳董', timestamp: '2024-01-12T09:00:00Z' },
    ]
  },
];

export default function WeComBoardPage() {
  const [categories] = useState<Category[]>(initialCategories);
  const [bundleCards, setBundleCards] = useState<BundleCard[]>(initialCards);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSummary, setShowSummary] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeCard = bundleCards.find(c => c.id === activeIdStr);
    if (!activeCard) return;

    // 找到目標分類
    let targetCategoryId: string | null = null;
    
    // 檢查是否拖曳到另一張卡片
    const overCard = bundleCards.find(c => c.id === overIdStr);
    if (overCard) {
      targetCategoryId = overCard.categoryId;
    }

    if (targetCategoryId && targetCategoryId !== activeCard.categoryId) {
      // 更新卡片分類並記錄審計
      setBundleCards(cards =>
        cards.map(card =>
          card.id === activeIdStr
            ? { ...card, categoryId: targetCategoryId, movedAt: new Date().toISOString() }
            : card
        )
      );
    }

    // 排序（同分類內）
    if (over && activeIdStr !== overIdStr) {
      setBundleCards((items) => {
        const oldIndex = items.findIndex(i => i.id === activeIdStr);
        const newIndex = items.findIndex(i => i.id === overIdStr);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }, [bundleCards]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    const activeCard = bundleCards.find(c => c.id === activeIdStr);
    if (!activeCard) return;

    // 跨分類拖曳時即時更新
    const overCard = bundleCards.find(c => c.id === overIdStr);
    if (overCard && activeCard.categoryId !== overCard.categoryId) {
      setBundleCards(cards =>
        cards.map(card =>
          card.id === activeIdStr
            ? { ...card, categoryId: overCard.categoryId }
            : card
        )
      );
    }
  }, [bundleCards]);

  const toggleCard = (cardId: string) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  const activeCard = activeId ? bundleCards.find(c => c.id === String(activeId)) : null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 WeCom 看板</h1>
        <div className="header-controls">
          <input
            type="text"
            placeholder="🔍 搜尋訊息..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button 
            className={`summary-toggle ${showSummary ? 'active' : ''}`}
            onClick={() => setShowSummary(!showSummary)}
          >
            {showSummary ? '📊 隱藏摘要' : '📊 顯示摘要'}
          </button>
        </div>
      </header>

      {showSummary && (
        <div className="summary-row">
          {categories.map(cat => (
            <SummaryCard
              key={cat.id}
              category={cat}
              cards={bundleCards.filter(c => c.categoryId === cat.id)}
            />
          ))}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="board">
          {categories.map(category => (
            <Column
              key={category.id}
              category={category}
              categoryId={category.id}
              cards={bundleCards.filter(c => c.categoryId === category.id)}
              expandedCardId={expandedCardId}
              onToggleCard={toggleCard}
              searchTerm={searchTerm}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <DragOverlayCard card={activeCard} />}
        </DragOverlay>
      </DndContext>

      <footer className="app-footer">
        <span>總計：{bundleCards.length} 張卡片</span>
        <span>•</span>
        <span>點擊卡片展開時間軸</span>
        <span>•</span>
        <span>拖曳移動卡片</span>
      </footer>
    </div>
  );
}
