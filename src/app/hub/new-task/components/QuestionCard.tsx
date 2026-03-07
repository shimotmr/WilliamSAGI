'use client';

import { useState } from 'react';

interface Question {
  id: string;
  type: 'single' | 'multi' | 'text' | 'priority';
  question: string;
  options?: string[];
}

interface QuestionCardProps {
  question: Question;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

export default function QuestionCard({ question, value, onChange }: QuestionCardProps) {
  const isMulti = question.type === 'multi';
  const currentValues = isMulti ? (value as string[]) || [] : [value as string];

  const handleSingleChange = (option: string) => {
    onChange(option);
  };

  const handleMultiChange = (option: string) => {
    const current = currentValues;
    if (current.includes(option)) {
      onChange(current.filter(v => v !== option));
    } else {
      onChange([...current, option]);
    }
  };

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  // Render for priority type
  if (question.type === 'priority') {
    const priorities = ['P0', 'P1', 'P2', 'P3'];
    const priorityColors: Record<string, string> = {
      P0: '#ef4444', P1: '#f97316', P2: '#fbbf24', P3: '#8A8F98',
    };
    
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '1rem',
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#EDEDEF',
          marginBottom: '0.75rem',
        }}>
          {question.question}
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {priorities.map(p => (
            <button
              key={p}
              onClick={() => handleSingleChange(p)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: `1px solid ${currentValues[0] === p ? priorityColors[p] : 'rgba(255,255,255,0.1)'}`,
                background: currentValues[0] === p ? `${priorityColors[p]}20` : 'rgba(255,255,255,0.03)',
                color: currentValues[0] === p ? priorityColors[p] : '#8A8F98',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Render for single type
  if (question.type === 'single') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '1rem',
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#EDEDEF',
          marginBottom: '0.75rem',
        }}>
          {question.question}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {question.options?.map(option => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: currentValues[0] === option ? 'rgba(94, 106, 210, 0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${currentValues[0] === option ? '#5E6AD2' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="radio"
                name={question.id}
                checked={currentValues[0] === option}
                onChange={() => handleSingleChange(option)}
                style={{ accentColor: '#5E6AD2' }}
              />
              <span style={{
                fontSize: '0.8125rem',
                color: currentValues[0] === option ? '#EDEDEF' : '#8A8F98',
              }}>
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Render for multi type
  if (question.type === 'multi') {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        padding: '1rem',
      }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#EDEDEF',
          marginBottom: '0.75rem',
        }}>
          {question.question} <span style={{ color: '#8A8F98', fontWeight: 400 }}>(可複選)</span>
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {question.options?.map(option => (
            <label
              key={option}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                background: currentValues.includes(option) ? 'rgba(94, 106, 210, 0.15)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${currentValues.includes(option) ? '#5E6AD2' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                type="checkbox"
                checked={currentValues.includes(option)}
                onChange={() => handleMultiChange(option)}
                style={{ accentColor: '#5E6AD2' }}
              />
              <span style={{
                fontSize: '0.8125rem',
                color: currentValues.includes(option) ? '#EDEDEF' : '#8A8F98',
              }}>
                {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Render for text type
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px',
      padding: '1rem',
    }}>
      <label style={{
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: 500,
        color: '#EDEDEF',
        marginBottom: '0.75rem',
      }}>
        {question.question}
      </label>
      <input
        type="text"
        value={(value as string) || ''}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="輸入內容..."
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
          color: '#EDEDEF',
          fontSize: '0.875rem',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
