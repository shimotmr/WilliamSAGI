'use client';

import { useState, useEffect, useRef } from 'react';

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

function CardItem({ card, onDragStart }: { card: Card; onDragStart: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; onDragStart(card.id); }}
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem', cursor: 'grab', userSelect: 'none', marginBottom: '0.5rem' }}
    >
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
  draggingId,
  onDrop,
  onDelete,
  onRename,
}: {
  column: Column;
  cards: Card[];
  draggingId: string | null;
  onDrop: (columnId: number) => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [localDragStart, setLocalDragStart] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  return (
    <div
      style={{ minWidth: 280, maxWidth: 300, background: dragOver ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.03)', border: dragOver ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 160px)', transition: 'border 0.15s, background 0.15s', flexShrink: 0 }}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); onDrop(column.id); }}
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
            <button onClick={onDelete} title="刪除此欄" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '1rem', padding: '2px 5px', borderRadius: '4px' }} onMouseOver={e => (e.currentTarget.style.color='#f87171')} onMouseOut={e => (e.currentTarget.style.color='#6b7280')}>✕</button>
          </div>
        )}
      </div>

      {/* 卡片區 */}
      <div style={{ padding: '0.75rem', overflowY: 'auto', flex: 1 }}>
        {cards.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>拖曳卡片到這裡</div>
        ) : (
          cards.map(card => (
            <CardItem
              key={card.id}
              card={card}
              onDragStart={setLocalDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function WeComBoardPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  async function handleDrop(columnId: number) {
    if (!draggingId || !draggingId) return;
    const card = cards.find(c => c.id === draggingId);
    if (!card || card.column_id === columnId) { setDraggingId(null); return; }

    // 樂觀更新
    setCards(prev => prev.map(c => c.id === draggingId ? { ...c, column_id: columnId } : c));
    setDraggingId(null);

    try {
      await fetch(`/api/hub/wecom-board/cards/${encodeURIComponent(draggingId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_id: columnId }),
      });
    } catch (e) {
      console.error('Move failed', e);
    }
  }

  async function handleDeleteColumn(id: number) {
    if (!confirm('確定刪除此欄？欄內卡片移回「未分類」。')) return;
    const res = await fetch(`/api/hub/wecom-board/columns?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { alert('刪除失敗'); return; }
    setColumns(prev => prev.filter(c => c.id !== id));
    setCards(prev => prev.map(c => c.column_id === id ? { ...c, column_id: 1 } : c));
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

  if (loading) return <div style={{ color: '#EDEDEF', padding: '2rem', textAlign: 'center' }}>載入中…</div>;

  return (
    <div style={{ color: '#EDEDEF', padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>WeCom 看板</h1>
        <p style={{ fontSize: '0.8rem', color: '#8A8F98' }}>整理轉傳訊息，拖曳卡片到對應公司欄</p>
      </div>

      <div
        style={{ display: 'flex', gap: '1rem', overflowX: 'auto', flex: 1, paddingBottom: '1rem', alignItems: 'flex-start' }}
        onDragEnd={() => setDraggingId(null)}
      >
        {columns.map(col => (
          <ColumnView
            key={col.id}
            column={col}
            cards={cards.filter(c => c.column_id === col.id)}
            draggingId={draggingId}
            onDrop={handleDrop}
            onDelete={() => handleDeleteColumn(col.id)}
            onRename={() => handleRenameColumn(col.id, col.name)}
          />
        ))}

        {/* 新增欄位 */}
        <div style={{ minWidth: 220, flexShrink: 0 }}>
          {showAddColumn ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '0.85rem' }}>
              <input
                autoFocus
                type="text"
                placeholder="輸入公司名稱"
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
            >＋ 新增公司欄位</button>
          )}
        </div>
      </div>
    </div>
  );
}
