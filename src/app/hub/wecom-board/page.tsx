'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// 全局動畫樣式
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

// 模組層級拖曳狀態（React 外部，100% 同步）
let _dragCardId: string | null = null;

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
  id: string; // parent_msg_id or msg_id
  column_id: number;
  sender_name: string;
  preview: string;
  message_count: number;
  messages: Message[];
}

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

function CardItem({ 
  card, 
  onDragStart, 
  onDelete,
  isBeingDragged,
  isInsertAbove,
  isInsertBelow,
}: { 
  card: Card; 
  onDragStart: (id: string) => void; 
  onDelete: (id: string) => void;
  isBeingDragged?: boolean;
  isInsertAbove?: boolean;
  isInsertBelow?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // 不切換展開狀態：點擊 ✕ 按鈕、連結、或拖曳時
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setExpanded(v => !v);
  };

  // 排擠視覺效果：被拖曳的卡片讓開
  const transform = isBeingDragged ? 'translateY(100%)' : '';
  const marginTop = isInsertAbove ? '52px' : '0'; // 卡片高度大約 52px
  const marginBottom = isInsertBelow ? '52px' : '0';

  return (
    <div
      draggable
      onDragStart={(e) => { 
        _dragCardId = card.id; 
        e.dataTransfer.effectAllowed = 'move'; 
        try { 
          e.dataTransfer.setData('text/plain', card.id); 
          e.dataTransfer.setData('drag-type', 'card');
        } catch(err) {} 
        onDragStart(card.id); 
      }}
      onClick={handleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{ 
        background: 'rgba(255,255,255,0.06)', 
        border: '1px solid rgba(255,255,255,0.1)', 
        borderRadius: '10px', 
        padding: '0.75rem', 
        cursor: 'grab', 
        userSelect: 'none', 
        position: 'relative',
        transform,
        marginTop,
        marginBottom,
        transition: 'transform 0.2s ease, margin 0.2s ease',
        opacity: isBeingDragged ? 0.4 : 1,
      }}
    >
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          title="刪除卡片"
          style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
        >✕</button>
      )}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
        <Avatar name={card.sender_name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#EDEDEF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{card.sender_name || '未知'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#8A8F98' }}>💬 {card.message_count}</span>
              <button
                onClick={() => setExpanded(e => !e)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8F98', fontSize: '0.75rem', padding: '0 2px' }}
              >{expanded ? '▲' : '▶'}</button>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.preview}</div>
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

function ColumnView({
  column,
  cards,
  onCardDragStart,
  onDrop,
  onDeleteColumn,
  onRename,
  onDeleteCard,
  onColumnDragStart,
  onColumnDrop,
  draggingCardId,
}: {
  column: Column;
  cards: Card[];
  onCardDragStart: (id: string) => void;
  onDrop: (columnId: number, cardId?: string, insertIndex?: number) => void;
  onDeleteColumn: () => void;
  onRename: () => void;
  onDeleteCard: (id: string) => void;
  onColumnDragStart: (id: number) => void;
  onColumnDrop: (targetId: number) => void;
  draggingCardId: string | null;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [columnDragOver, setColumnDragOver] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 按 send_time 排序卡片（保持與 DB 一致）
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      // 先用 _order（本地排序）
      if ((a as any)._order !== undefined && (b as any)._order !== undefined) {
        return (a as any)._order - (b as any)._order;
      }
      // 再用 send_time
      const aTime = a.messages[0]?.send_time || 0;
      const bTime = b.messages[0]?.send_time || 0;
      return aTime - bTime;
    });
  }, [cards]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
    
    // 計算插入位置
    if (draggingCardId) {
      const clientY = e.clientY;
      let newInsertIndex = sortedCards.length;
      
      for (let i = 0; i < sortedCards.length; i++) {
        if (sortedCards[i].id === draggingCardId) continue; // 跳過自己
        
        const cardEl = cardRefs.current.get(sortedCards[i].id);
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect();
          const midY = rect.top + rect.height / 2;
          
          if (clientY < midY) {
            newInsertIndex = i;
            break;
          }
        }
      }
      
      setInsertIndex(newInsertIndex);
    }
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setColumnDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setInsertIndex(null);
    
    const dragType = e.dataTransfer.getData('drag-type');
    if (dragType === 'column') {
      onColumnDrop(column.id);
      return;
    }
    
    const cardId = _dragCardId || e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('cardId');
    _dragCardId = null;
    
    if (cardId) {
      // 取得插入索引（如果有的話）
      onDrop(column.id, cardId, insertIndex ?? undefined);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // 檢查是否離開了 column 區域
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOver(false);
      setInsertIndex(null);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => { onColumnDragStart(column.id); try { e.dataTransfer.setData('drag-type', 'column'); e.dataTransfer.setData('column-id', String(column.id)); } catch(err) {} }}
      onDragOver={handleColumnDragOver}
      onDragLeave={() => setColumnDragOver(false)}
      onDrop={handleDrop}
      style={{ minWidth: 280, maxWidth: 300, background: columnDragOver ? 'rgba(96,165,250,0.12)' : (dragOver ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)'), border: columnDragOver ? '2px solid #60a5fa' : (dragOver ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.08)'), borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', transition: 'border 0.15s, background 0.15s', flexShrink: 0, cursor: 'grab' }}
    >
      {/* 欄位標題 */}
      <div style={{ padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#EDEDEF' }}>{column.name}</span>
          <span style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '999px', padding: '1px 8px', fontSize: '0.75rem', color: '#9ca3af' }}>{cards.length}</span>
        </div>
        {!column.is_default && (
          <div style={{ display: 'flex', gap: '2px' }}>
            <button onClick={onRename} title="重新命名" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.85rem', padding: '2px 5px', borderRadius: '4px' }} onMouseOver={e => (e.currentTarget.style.color='#60a5fa')} onMouseOut={e => (e.currentTarget.style.color='#6b7280')}>✎</button>
            <button onClick={onDeleteColumn} title="刪除此欄" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', padding: '2px 5px', borderRadius: '4px' }} onMouseOver={e => (e.currentTarget.style.color='#f87171')} onMouseOut={e => (e.currentTarget.style.color='#6b7280')}>✕</button>
          </div>
        )}
      </div>

      {/* 卡片區 */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{ padding: '0.75rem', overflowY: 'auto', flex: 1, position: 'relative' }}
      >
        {/* 插入指示線 */}
        {insertIndex !== null && draggingCardId && (
          <div 
            style={{
              position: 'absolute',
              top: insertIndex === 0 ? '8px' : `${insertIndex * 52 + 8}px`,
              left: '0.5rem',
              right: '0.5rem',
              height: '2px',
              background: '#60a5fa',
              borderRadius: '1px',
              zIndex: 20,
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
        )}
        {sortedCards.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>拖曳卡片到這裡</div>
        ) : (
          sortedCards.map((card, index) => {
            const isBeingDragged = card.id === draggingCardId;
            const isInsertAbove = insertIndex !== null && index === insertIndex && insertIndex < cards.length;
            const isInsertBelow = insertIndex !== null && index === insertIndex - 1 && insertIndex > 0;
            
            return (
              <div key={card.id} ref={(el) => { if (el) cardRefs.current.set(card.id, el); }}>
                <CardItem
                  card={card}
                  onDragStart={onCardDragStart}
                  onDelete={onDeleteCard}
                  isBeingDragged={isBeingDragged}
                  isInsertAbove={isInsertAbove}
                  isInsertBelow={isInsertBelow}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function WeComBoardPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const setDraggingId = useCallback((id: string | null) => { 
    draggingRef.current = id; 
    setDraggingCardId(id);
  }, []);
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);

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

  async function handleDrop(columnId: number, cardId?: string, insertIndex?: number) {
    const id = cardId || draggingRef.current;
    if (!id) return;
    
    const card = cards.find(c => c.id === id);
    if (!card) return;
    
    // 清除拖曳狀態
    setDraggingCardId(null);
    draggingRef.current = null;

    // 取得該欄目前的卡片（按 send_time 排序）
    const columnCards = cards
      .filter(c => c.column_id === columnId)
      .sort((a, b) => {
        const aTime = a.messages[0]?.send_time || 0;
        const bTime = b.messages[0]?.send_time || 0;
        return aTime - bTime;
      });

    if (card.column_id === columnId && insertIndex !== undefined) {
      // 同欄排序：只在本地更新順序，不存 DB（重新整理會按 send_time 重新排序）
      const currentIndex = columnCards.findIndex(c => c.id === id);
      if (currentIndex !== -1 && currentIndex !== insertIndex) {
        // 移除並重新插入
        const newOrder = [...columnCards];
        newOrder.splice(currentIndex, 1);
        newOrder.splice(insertIndex > currentIndex ? insertIndex - 1 : insertIndex, 0, card);
        
        // 更新所有卡片的順序（透過更新 messages 陣列來觸發重渲染）
        setCards(prev => prev.map(c => {
          const newPos = newOrder.findIndex(oc => oc.id === c.id);
          if (newPos !== -1) {
            return { ...c, _order: newPos };
          }
          return c;
        }));
      }
      return;
    }

    // 跨欄移動
    if (card.column_id !== columnId) {
      // 樂觀更新
      setCards(prev => prev.map(c => c.id === id ? { ...c, column_id: columnId } : c));

      try {
        await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ column_id: columnId }),
        });
      } catch (e) {
        console.error('Move failed', e);
      }
    }
  }

  async function handleDeleteColumn(id: number) {
    if (!confirm('確定刪除此欄？欄內卡片移回「未分類」。')) return;
    const res = await fetch(`/api/hub/wecom-board/columns?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('刪除失敗'); return; }
    setColumns(prev => prev.filter(c => c.id !== id));
    setCards(prev => prev.map(c => c.column_id === id ? { ...c, column_id: 1 } : c));
  }

  async function handleDeleteCard(id: string) {
    if (!confirm('確定刪除此卡片？')) return;
    const res = await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) { alert('刪除失敗'); return; }
    setCards(prev => prev.filter(c => c.id !== id));
  }

  async function handleRenameColumn(id: number, name: string) {
    const newName = prompt('輸入新名稱：', name);
    if (!newName?.trim() || newName.trim() === name) return;
    const res = await fetch(`/api/hub/wecom-board/columns?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) { alert('重新命名失敗'); return; }
    setColumns(prev => prev.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
  }

  async function addColumn() {
    if (!newColumnName.trim() || isAddingColumn) return;
    setIsAddingColumn(true);
    const name = newColumnName.trim();
    setNewColumnName(''); setShowAddColumn(false);
    try {
      const res = await fetch('/api/hub/wecom-board/columns', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const col = await res.json();
      setColumns(prev => [...prev, col]);
    } finally { setIsAddingColumn(false); }
  }

  const [draggingColumnId, setDraggingColumnId] = useState<number | null>(null);

  function handleColumnDragStart(id: number) {
    setDraggingColumnId(id);
  }

  async function handleColumnReorder(targetColumnId: number) {
    if (draggingColumnId === null || draggingColumnId === targetColumnId) return;
    
    const draggedId = draggingColumnId;
    setDraggingColumnId(null);

    // 取得目前排序
    const currentOrder = columns.map(c => c.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetColumnId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;

    // 重新排列
    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    // 樂觀更新
    setColumns(prev => {
      const reordered = newOrder.map((id, idx) => {
        const col = prev.find(c => c.id === id);
        return col ? { ...col, position: idx } : null;
      }).filter(Boolean) as Column[];
      return reordered;
    });

    try {
      await fetch('/api/hub/wecom-board/columns?reorder=1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: newOrder }),
      });
    } catch (e) {
      console.error('Reorder failed', e);
    }
  }

  if (loading) return <div style={{ color: '#EDEDEF', padding: '2rem', textAlign: 'center' }}>載入中…</div>;

  return (
    <div style={{ color: '#EDEDEF', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>WeCom 看板</h1>
        <p style={{ fontSize: '0.8rem', color: '#8A8F98' }}>整理轉傳訊息，拖曳卡片到對應分類欄</p>
      </div>

      <div
        style={{ display: 'flex', gap: '1rem', overflowX: 'auto', flex: 1, paddingBottom: '1rem', alignItems: 'flex-start' }}
        onDragEnd={() => { draggingRef.current = null; }}
      >
        {columns.map(col => (
          <ColumnView
            key={col.id}
            column={col}
            cards={cards.filter(c => c.column_id === col.id)}
            onCardDragStart={setDraggingId}
            onDrop={handleDrop}
            onDeleteColumn={() => handleDeleteColumn(col.id)}
            onRename={() => handleRenameColumn(col.id, col.name)}
            onDeleteCard={handleDeleteCard}
            onColumnDragStart={handleColumnDragStart}
            onColumnDrop={handleColumnReorder}
            draggingCardId={draggingCardId}
          />
        ))}

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
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColumn(); } if (e.key === 'Escape') { setShowAddColumn(false); setNewColumnName(''); } }}
                style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#EDEDEF', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box', marginBottom: '0.5rem' }}
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
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '0.85rem', color: '#9ca3af', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >＋ 新增分類欄位</button>
          )}
        </div>
      </div>
    </div>
  );
}
