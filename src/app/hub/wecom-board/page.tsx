'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 全局動畫樣式
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(style);
}

interface Column {
  id: number;
  name: string;
  position: number;
  is_default: boolean;
}

interface Message {
  id: number;
  sender_name: string;
  content: string;
  msg_type: string;
  send_time: number;
  parent_msg_id: string | null;
  column_id: number;
}

interface Card {
  id: string;
  column_id: number;
  sender_name: string;
  preview: string;
  message_count: number;
  messages: Message[];
}

// Avatar 元件
function Avatar({ name }: { name: string }) {
  const initials = (name || '?').slice(0, 2).toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#06b6d4'];
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// 可排序的卡片元件
function SortableCard({
  card,
  onDelete,
  isMobile,
}: {
  card: Card;
  onDelete: (id: string) => void;
  isMobile: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setExpanded(v => !v);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onMouseEnter={() => !isMobile && setShowDelete(true)}
      onMouseLeave={() => !isMobile && setShowDelete(false)}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => {
        // 允許點擊展開，但 dnd-kit 會處理長按拖曳
        e.stopPropagation();
      }}
      onClickCapture={(e) => {
        // 阻止拖曳觸發點擊
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{
        ...style,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '0.75rem',
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
      }}
    >
      {/* 刪除按鈕 */}
      {showDelete && !isMobile && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          title="刪除卡片"
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: 'rgba(239,68,68,0.9)',
            border: 'none',
            borderRadius: '4px',
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >✕</button>
      )}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <Avatar name={card.sender_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EDEDEF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {card.sender_name || '未知'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#8A8F98' }}>💬 {card.message_count}</span>
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(e => !e); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8F98', fontSize: '0.75rem', padding: '0 2px' }}
              >{expanded ? '▲' : '▶'}</button>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.preview}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem', maxHeight: '300px', overflowY: 'auto' }}>
          {card.messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
              <Avatar name={m.sender_name} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>{m.sender_name}</div>
                <div style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: 1.5 }}>{m.content || `[${m.msg_type}]`}</div>
                <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '2px' }}>
                  {m.send_time ? new Date(m.send_time * 1000).toLocaleString('zh-TW') : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 卡片預覽（用於 DragOverlay）
function CardOverlay({ card, isMobile }: { card: Card; isMobile: boolean }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(96,165,250,0.4)',
        borderRadius: '10px',
        padding: '0.75rem',
        cursor: 'grabbing',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transform: 'rotate(3deg)',
      }}
    >
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <Avatar name={card.sender_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EDEDEF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
              {card.sender_name || '未知'}
            </span>
            <span style={{ fontSize: '0.72rem', color: '#8A8F98' }}>💬 {card.message_count}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {card.preview}
          </div>
        </div>
      </div>
    </div>
  );
}

// 可排序的欄位元件
function SortableColumn({
  column,
  cards,
  onDeleteColumn,
  onRename,
  onDeleteCard,
  isMobile,
}: {
  column: Column;
  cards: Card[];
  onDeleteColumn: () => void;
  onRename: () => void;
  onDeleteCard: (id: string) => void;
  isMobile: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column-${column.id}`,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const cardIds = useMemo(() => cards.map(c => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        minWidth: 280,
        maxWidth: 300,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 160px)',
        flexShrink: 0,
      }}
    >
      {/* 欄位標題 */}
      <div
        {...attributes}
        {...listeners}
        style={{
          padding: '0.85rem 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          cursor: 'grab',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#EDEDEF' }}>{column.name}</span>
          <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', color: '#9ca3af' }}>
            {cards.length}
          </span>
        </div>
        {!column.is_default && (
          <div style={{ display: 'flex', gap: '2px' }}>
            <button
              onClick={(e) => { e.stopPropagation(); onRename(); }}
              title="重新命名"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.85rem', padding: '2px 5px', borderRadius: '4px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#60a5fa')}
              onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}
            >✎</button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteColumn(); }}
              title="刪除此欄"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', padding: '2px 5px', borderRadius: '4px' }}
              onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
              onMouseOut={e => (e.currentTarget.style.color = '#6b7280')}
            >✕</button>
          </div>
        )}
      </div>

      {/* 卡片區 */}
      <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>
              拖曳卡片到這裡
            </div>
          ) : (
            cards.map(card => (
              <div key={card.id} style={{ marginBottom: '0.5rem' }}>
                <SortableCard card={card} onDelete={onDeleteCard} isMobile={isMobile} />
              </div>
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

// 欄位預覽（用於 DragOverlay）
function ColumnOverlay({ column, cardCount }: { column: Column; cardCount: number }) {
  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 300,
        background: 'rgba(255,255,255,0.08)',
        border: '2px solid #60a5fa',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transform: 'rotate(3deg)',
      }}
    >
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#EDEDEF' }}>{column.name}</span>
        <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', color: '#9ca3af' }}>
          {cardCount}
        </span>
      </div>
    </div>
  );
}

export default function WeComBoardPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  // 手機狀態
  const [isMobile, setIsMobile] = useState(false);

  // 檢測手機寬度
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 設定感測器（支援手機和桌機）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移動 8px 才觸發拖曳
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 長按 200ms 才觸發拖曳
        tolerance: 5, // 允許 5px 移動誤差
      },
    })
  );

  // 取得 column IDs 用於橫向排序
  const columnIds = useMemo(() => columns.map(c => `column-${c.id}`), [columns]);

  // 取得 active item 的資料
  const activeCard = useMemo(() => {
    if (!activeId) return null;
    const id = String(activeId);
    if (id.startsWith('column-')) return null;
    return cards.find(c => c.id === id) || null;
  }, [activeId, cards]);

  const activeColumn = useMemo(() => {
    if (!activeId) return null;
    const id = String(activeId);
    if (!id.startsWith('column-')) return null;
    const colId = parseInt(id.replace('column-', ''));
    return columns.find(c => c.id === colId) || null;
  }, [activeId, columns]);

  // 初始化資料
  useEffect(() => {
    async function fetchData() {
      try {
        const [colRes, cardRes] = await Promise.all([
          fetch('/api/hub/wecom-board/columns'),
          fetch('/api/hub/wecom-board/cards'),
        ]);
        const colData = await colRes.json();
        const cardData = await cardRes.json();
        setColumns(Array.isArray(colData) ? colData : []);
        setCards(Array.isArray(cardData) ? cardData : (cardData.cards || []));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // 拖曳開始
  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id);
  }

  // 拖曳中（跨欄移動時即時更新）
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 略過欄位排序的處理
    if (activeId.startsWith('column-') || overId.startsWith('column-')) return;

    // 找出被拖曳的卡片
    const activeCard = cards.find(c => c.id === activeId);
    if (!activeCard) return;

    // 找出目標欄位
    let targetColumnId: number | null = null;

    if (overId.startsWith('column-')) {
      // 放到欄位上
      targetColumnId = parseInt(overId.replace('column-', ''));
    } else {
      // 放到另一張卡片上
      const overCard = cards.find(c => c.id === overId);
      if (overCard) {
        targetColumnId = overCard.column_id;
      }
    }

    if (targetColumnId === null) return;

    // 如果卡片換欄，即時更新
    if (activeCard.column_id !== targetColumnId) {
      setCards(prev => prev.map(c =>
        c.id === activeId ? { ...c, column_id: targetColumnId! } : c
      ));
    }
  }

  // 拖曳結束
  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // 處理欄位排序
    if (activeId.startsWith('column-') && overId.startsWith('column-')) {
      const activeColId = parseInt(activeId.replace('column-', ''));
      const overColId = parseInt(overId.replace('column-', ''));

      if (activeColId !== overColId) {
        const oldIndex = columns.findIndex(c => c.id === activeColId);
        const newIndex = columns.findIndex(c => c.id === overColId);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newColumns = arrayMove(columns, oldIndex, newIndex).map((c, i) => ({
            ...c,
            position: i,
          }));

          setColumns(newColumns);

          // API 更新
          try {
            await fetch('/api/hub/wecom-board/columns?reorder=1', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: newColumns.map(c => c.id) }),
            });
          } catch (e) {
            console.error('Column reorder failed', e);
          }
        }
      }
      return;
    }

    // 處理卡片排序
    if (!activeId.startsWith('column-') && !overId.startsWith('column-')) {
      const activeCard = cards.find(c => c.id === activeId);
      const overCard = cards.find(c => c.id === overId);

      if (activeCard && overCard && activeCard.column_id === overCard.column_id) {
        // 同欄排序 - 只更新本地狀態
        const columnCards = cards
          .filter(c => c.column_id === activeCard.column_id)
          .sort((a, b) => {
            const aTime = a.messages[0]?.send_time || 0;
            const bTime = b.messages[0]?.send_time || 0;
            return aTime - bTime;
          });

        const oldIndex = columnCards.findIndex(c => c.id === activeId);
        const newIndex = columnCards.findIndex(c => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          // 保持同欄內的相對順序（本地 state，不存 DB）
          const reorderedIds = arrayMove(
            columnCards.map(c => c.id),
            oldIndex,
            newIndex
          );

          setCards(prev => {
            const otherCards = prev.filter(c => c.column_id !== activeCard.column_id);
            const reorderedCards = reorderedIds.map((id, idx) => {
              const card = columnCards.find(c => c.id === id)!;
              return { ...card, _order: idx };
            });
            return [...otherCards, ...reorderedCards];
          });
        }
        return;
      }

      // 跨欄移動 - API 更新
      if (activeCard && overCard && activeCard.column_id !== overCard.column_id) {
        try {
          await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(activeId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: overCard.column_id }),
          });
        } catch (e) {
          console.error('Move failed', e);
        }
        return;
      }
    }

    // 卡片放到空欄位
    if (!activeId.startsWith('column-') && overId.startsWith('column-')) {
      const activeCard = cards.find(c => c.id === activeId);
      const targetColId = parseInt(overId.replace('column-', ''));

      if (activeCard && activeCard.column_id !== targetColId) {
        try {
          await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(activeId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ column_id: targetColId }),
          });
        } catch (e) {
          console.error('Move failed', e);
        }
      }
    }
  }

  // 刪除欄位
  async function handleDeleteColumn(id: number) {
    if (!confirm('確定刪除此欄？欄內卡片移回「未分類」。')) return;
    const res = await fetch(`/api/hub/wecom-board/columns?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('刪除失敗'); return; }
    setColumns(prev => prev.filter(c => c.id !== id));
    setCards(prev => prev.map(c => c.column_id === id ? { ...c, column_id: 1 } : c));
  }

  // 刪除卡片
  async function handleDeleteCard(id: string) {
    if (!confirm('確定刪除此卡片？')) return;
    const res = await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) { alert('刪除失敗'); return; }
    setCards(prev => prev.filter(c => c.id !== id));
  }

  // 重新命名欄位
  async function handleRenameColumn(id: number, name: string) {
    const newName = prompt('輸入新名稱：', name);
    if (!newName?.trim() || newName.trim() === name) return;
    const res = await fetch(`/api/hub/wecom-board/columns?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) { alert('重新命名失敗'); return; }
    setColumns(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
  }

  // 新增欄位
  async function addColumn() {
    if (!newColumnName.trim() || isAddingColumn) return;
    setIsAddingColumn(true);
    const name = newColumnName.trim();
    setNewColumnName('');
    setShowAddColumn(false);
    try {
      const res = await fetch('/api/hub/wecom-board/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const col = await res.json();
      setColumns(prev => [...prev, col]);
    } finally {
      setIsAddingColumn(false);
    }
  }

  if (loading) return <div style={{ color: '#EDEDEF', padding: '2rem', textAlign: 'center' }}>載入中…</div>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div style={{ color: '#EDEDEF', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>WeCom 看板</h1>
          <p style={{ fontSize: '0.8rem', color: '#8A8F98' }}>整理轉傳訊息，拖曳卡片到對應分類欄</p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            overflowX: 'auto',
            flex: 1,
            paddingBottom: '1rem',
            alignItems: 'flex-start',
          }}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {columns.map(col => (
              <SortableColumn
                key={col.id}
                column={col}
                cards={cards.filter(c => c.column_id === col.id)}
                onDeleteColumn={() => handleDeleteColumn(col.id)}
                onRename={() => handleRenameColumn(col.id, col.name)}
                onDeleteCard={handleDeleteCard}
                isMobile={isMobile}
              />
            ))}
          </SortableContext>

          {/* 新增欄位 */}
          <div style={{ minWidth: 220, flexShrink: 0 }}>
            {showAddColumn ? (
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="輸入分類名稱"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { e.preventDefault(); addColumn(); }
                    if (e.key === 'Escape') { setShowAddColumn(false); setNewColumnName(''); }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    color: '#EDEDEF',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '0.5rem',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onMouseDown={e => { e.preventDefault(); addColumn(); }}
                    style={{ flex: 1, background: '#3b82f6', border: 'none', borderRadius: '6px', padding: '0.4rem', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >確認新增</button>
                  <button
                    onClick={() => { setShowAddColumn(false); setNewColumnName(''); }}
                    style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '6px', padding: '0.4rem 0.6rem', color: '#9ca3af', cursor: 'pointer' }}
                  >✕</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddColumn(true)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px dashed rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '0.85rem',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >＋ 新增分類欄位</button>
            )}
          </div>
        </div>
      </div>

      {/* 拖曳時的浮動預覽 */}
      <DragOverlay>
        {activeCard && <CardOverlay card={activeCard} isMobile={isMobile} />}
        {activeColumn && (
          <ColumnOverlay
            column={activeColumn}
            cardCount={cards.filter(c => c.column_id === activeColumn.id).length}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
