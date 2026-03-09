'use client';

import { useState, useCallback, useEffect } from 'react';
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
  UniqueIdentifier,
  useDroppable,
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
  id: number;
  sender_name: string;
  content: string;
  send_time: number;
}

interface BundleCard {
  id: string;
  column_id: number;
  sender_name: string;
  preview: string;
  message_count: number;
  created_at: string;
  messages: Message[];
}

interface Column {
  id: number;
  name: string;
  position: number;
  is_default: boolean;
}

// ============== Components ==============

function Avatar({ name }: { name: string }) {
  const encoded = encodeURIComponent(name || '未知');
  return (
    <img
      src={`https://ui-avatars.com/api/?name=${encoded}&background=random&size=32`}
      alt={name}
      className="avatar"
    />
  );
}

function BundleCardComponent({
  card,
  isExpanded,
  onToggle,
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

  const formatTime = (ts: number | string) => {
    if (typeof ts === 'number') {
      // Unix timestamp (seconds)
      return new Date(ts * 1000).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return new Date(ts).toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const title = card.messages?.[0]?.content?.slice(0, 30) || '訊息包';
  const lastSender = card.messages?.[card.messages.length - 1]?.sender_name || card.sender_name;

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
          <Avatar name={lastSender} />
          <span className="bundle-title">{title}</span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        <div className="bundle-meta">
          <span className="sender">👤 {card.sender_name}</span>
          <span className="message-count">💬 {card.message_count}</span>
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
                <div className="timeline-avatar">
                  <Avatar name={msg.sender_name} />
                </div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-sender">{msg.sender_name}</span>
                    <span className="timeline-time">{formatTime(msg.send_time)}</span>
                  </div>
                  <p className="timeline-text">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Column({
  column,
  cards,
  expandedCardId,
  onToggleCard,
}: {
  column: Column;
  cards: BundleCard[];
  expandedCardId: string | null;
  onToggleCard: (id: string) => void;
  onDeleteColumn?: () => void;
  onRenameColumn?: () => void;
}) {
  const cardIds = cards.map((c) => c.id);
  const { setNodeRef, isOver } = useDroppable({ id: String(column.id) });

  return (
    <div className="column" ref={setNodeRef} style={{ outline: isOver ? '2px dashed #60a5fa' : 'none', borderRadius: '8px' }}>
      <div className="column-header">
        <div className="column-title">
          <h3 style={{ cursor: !column.is_default && onRenameColumn ? 'pointer' : 'default' }} onDoubleClick={!column.is_default && onRenameColumn ? onRenameColumn : undefined} title={!column.is_default ? '雙擊可重新命名' : ''}>{column.name}</h3>
          <span className="column-count">{cards.length}</span>
        </div>
        {!column.is_default && (
          <div style={{ display: 'flex', gap: '2px' }}>
            {onRenameColumn && (
              <button onClick={onRenameColumn} title="重新命名" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.85rem', padding: '2px 5px', borderRadius: '4px', lineHeight: 1 }} onMouseOver={e => (e.currentTarget.style.color = '#60a5fa')} onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}>✎</button>
            )}
            {onDeleteColumn && (
              <button onClick={onDeleteColumn} title="刪除此欄" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', padding: '2px 5px', borderRadius: '4px', lineHeight: 1 }} onMouseOver={e => (e.currentTarget.style.color = '#f87171')} onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}>✕</button>
            )}
          </div>
        )}
      </div>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div className="column-content">
          {cards.map((card) => (
            <BundleCardComponent
              key={card.id}
              card={card}
              isExpanded={expandedCardId === card.id}
              onToggle={() => onToggleCard(card.id)}
            />
          ))}
          {cards.length === 0 && <div className="empty-column">無卡片</div>}
        </div>
      </SortableContext>
    </div>
  );
}

function DragOverlayCard({ card }: { card: BundleCard }) {
  const title = card.messages?.[0]?.content?.slice(0, 30) || '訊息包';
  return (
    <div className="bundle-card dragging-overlay">
      <div className="bundle-header">
        <div className="bundle-title-row">
          <Avatar name={card.sender_name} />
          <span className="bundle-title">{title}</span>
        </div>
        <div className="bundle-meta">
          <span className="sender">👤 {card.sender_name}</span>
          <span className="message-count">💬 {card.message_count}</span>
        </div>
      </div>
    </div>
  );
}

// ============== Main Page ==============

export default function WeComBoardPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<BundleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);

  // 載入資料
  useEffect(() => {
    async function fetchData() {
      try {
        const [columnsRes, cardsRes] = await Promise.all([
          fetch('/api/hub/wecom-board/columns'),
          fetch('/api/hub/wecom-board/cards'),
        ]);

        const columnsData = await columnsRes.json();
        const cardsData = await cardsRes.json();

        setColumns(columnsData);
        setCards(cardsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  async function handleDeleteColumn(columnId: number) {
    if (!confirm('確定要刪除此欄？欄內卡片將移回「未分類」。')) return;
    try {
      const res = await fetch(`/api/hub/wecom-board/columns?id=${columnId}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); alert(d.error || '刪除失敗'); return; }
      setColumns(prev => prev.filter(c => c.id !== columnId));
      setCards(prev => prev.map(c => c.column_id === columnId ? { ...c, column_id: 1 } : c));
    } catch { alert('刪除失敗'); }
  }

  async function handleRenameColumn(columnId: number, currentName: string) {
    const newName = prompt('輸入新的公司名稱：', currentName);
    if (!newName || !newName.trim() || newName.trim() === currentName) return;
    try {
      const res = await fetch(`/api/hub/wecom-board/columns?id=${columnId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.error || '重新命名失敗'); return; }
      const updated = await res.json();
      setColumns(prev => prev.map(c => c.id === columnId ? { ...c, name: updated.name } : c));
    } catch { alert('重新命名失敗'); }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeIdStr = String(active.id);
      const activeCard = cards.find((c) => c.id === activeIdStr);
      if (!activeCard) return;

      // 找到目標欄位
      let targetColumnId: number | null = null;

      // 檢查是否拖曳到另一張卡片
      const overCard = cards.find((c) => c.id === String(over.id));
      if (overCard) {
        targetColumnId = overCard.column_id;
      } else {
        // 檢查是否拖曳到欄位空白處
        const overId = String(over.id);
        const targetColumn = columns.find((col) => String(col.id) === overId);
        if (targetColumn) {
          targetColumnId = targetColumn.id;
        }
      }

      if (targetColumnId && targetColumnId !== activeCard.column_id) {
        // 樂觀更新 UI
        setCards((prev) =>
          prev.map((card) =>
            card.id === activeIdStr ? { ...card, column_id: targetColumnId! } : card
          )
        );

        // 呼叫 API
        try {
          await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(activeIdStr)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: targetColumnId }),
          });
        } catch (error) {
          console.error('Failed to move card:', error);
        }
      }
    },
    [cards, columns]
  );

  const toggleCard = (cardId: string) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  const addColumn = async () => {
    if (!newColumnName.trim()) return;

    try {
      const res = await fetch('/api/hub/wecom-board/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColumnName.trim() }),
      });

      const newColumn = await res.json();
      setColumns((prev) => [...prev, newColumn]);
      setNewColumnName('');
      setShowAddColumn(false);
    } catch (error) {
      console.error('Failed to add column:', error);
    }
  };

  const activeCard = activeId ? cards.find((c) => c.id === String(activeId)) : null;

  if (loading) {
    return (
      <div className="app loading">
        <div className="loading-spinner">載入中...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 WeCom 看板</h1>
        <p className="subtitle">整理轉傳訊息，按公司分類</p>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={cards.filter((c) => c.column_id === column.id)}
              expandedCardId={expandedCardId}
              onToggleCard={toggleCard}
              onDeleteColumn={column.is_default ? undefined : () => handleDeleteColumn(column.id)}
              onRenameColumn={column.is_default ? undefined : () => handleRenameColumn(column.id, column.name)}
            />
          ))}

          {/* 新增欄位 */}
          <div className="column add-column">
            {showAddColumn ? (
              <div className="add-column-form">
                <input
                  type="text"
                  placeholder="輸入公司名稱"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addColumn()}
                  autoFocus
                />
                <div className="add-column-actions">
                  <button onClick={addColumn} className="btn-primary">
                    新增
                  </button>
                  <button onClick={() => setShowAddColumn(false)} className="btn-secondary">
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-column-btn" onClick={() => setShowAddColumn(true)}>
                + 新增公司欄
              </button>
            )}
          </div>
        </div>

        <DragOverlay>{activeCard && <DragOverlayCard card={activeCard} />}</DragOverlay>
      </DndContext>

      <footer className="app-footer">
        <span>總計：{cards.length} 張卡片</span>
        <span>•</span>
        <span>點擊卡片展開時間軸</span>
        <span>•</span>
        <span>拖曳移動卡片</span>
      </footer>
    </div>
  );
}
