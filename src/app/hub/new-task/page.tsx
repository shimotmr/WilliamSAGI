'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionCard from './components/QuestionCard';

interface Question {
  id: string;
  type: 'single' | 'multi' | 'text' | 'priority';
  question: string;
  options?: string[];
}

type Step = 'input' | 'questions' | 'confirm';

export default function NewTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [taskType, setTaskType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskId, setTaskId] = useState<number | null>(null);

  // Step 1: Submit description to get questions
  const handleSubmitDescription = async () => {
    if (!description.trim()) {
      setError('請輸入任務描述');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/new-task/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '發生錯誤');
        return;
      }

      setQuestions(data.questions || []);
      setTaskType(data.type || '其他');
      
      // Initialize empty answers
      const initialAnswers: Record<string, string | string[]> = {};
      (data.questions || []).forEach((q: Question) => {
        initialAnswers[q.id] = q.type === 'multi' ? [] : '';
      });
      setAnswers(initialAnswers);
      setStep('questions');
    } catch (err) {
      setError('網路錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle answer changes
  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Step 2: Proceed to confirmation
  const handleProceedToConfirm = () => {
    setStep('confirm');
  };

  // Step 3: Submit task
  const handleSubmitTask = async () => {
    // Get priority from answers
    const priority = (answers.priority as string) || 'P2';

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/new-task/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, answers, priority }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '發生錯誤');
        return;
      }

      setTaskId(data.id);
      
      // Show success and redirect
      setTimeout(() => {
        router.push('/hub/board');
      }, 1500);
    } catch (err) {
      setError('網路錯誤，請稍後重試');
    } finally {
      setLoading(false);
    }
  };

  // Get current priority for display
  const currentPriority = (answers.priority as string) || 'P2';
  const priorityColors: Record<string, string> = {
    P0: '#ef4444', P1: '#f97316', P2: '#fbbf24', P3: '#8A8F98',
  };

  return (
    <div style={{ color: '#EDEDEF', maxWidth: '640px', margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 data-testid="new-task-title" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          新建任務
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8A8F98' }}>
          描述你的需求，讓 AI 幫你釐清細節
        </p>
      </div>

      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {['input', 'questions', 'confirm'].map((s, idx) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: step === s ? '#5E6AD2' : step !== s && ['questions', 'confirm'].includes(step) ? '#4ade80' : 'rgba(255,255,255,0.1)',
              color: step === s || step !== s && ['questions', 'confirm'].includes(step) ? '#fff' : '#8A8F98',
              transition: 'all 0.2s ease',
            }}>
              {step !== s && ['questions', 'confirm'].includes(step) ? '✓' : idx + 1}
            </div>
            {idx < 2 && (
              <div style={{
                width: '3rem',
                height: '2px',
                background: step !== s ? 'rgba(255,255,255,0.1)' : '#5E6AD2',
                transition: 'all 0.2s ease',
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Input Description */}
      {step === 'input' && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '1.5rem',
        }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#EDEDEF',
            marginBottom: '0.75rem',
          }}>
            你想要做什麼？
          </label>
          <textarea
            data-testid="task-description-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="例如：分析上週的銷售數據，找出成長最快的產品類別"
            rows={4}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)',
              color: '#EDEDEF',
              fontSize: '0.9375rem',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8125rem', marginTop: '0.75rem' }}>{error}</p>
          )}

          <button
            data-testid="task-description-next"
            onClick={handleSubmitDescription}
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '1.25rem',
              padding: '0.875rem',
              borderRadius: '10px',
              border: 'none',
              background: loading ? '#5E6AD280' : '#5E6AD2',
              color: '#fff',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? '處理中...' : '下一步'}
          </button>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === 'questions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: 'rgba(94, 106, 210, 0.1)',
            border: '1px solid rgba(94, 106, 210, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '0.5rem',
          }}>
            <p style={{ fontSize: '0.8125rem', color: '#8A8F98', marginBottom: '0.25rem' }}>任務類型</p>
            <p data-testid="detected-task-type" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#EDEDEF' }}>{taskType}</p>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '1.5rem',
          }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#EDEDEF', marginBottom: '1rem' }}>
              讓我更了解你的需求
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map(q => (
                <QuestionCard
                  key={q.id}
                  question={q}
                  value={answers[q.id]}
                  onChange={val => handleAnswerChange(q.id, val)}
                />
              ))}
            </div>
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.8125rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setStep('input')}
              style={{
                flex: 1,
                padding: '0.875rem',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent',
                color: '#8A8F98',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              上一步
            </button>
            <button
              data-testid="questions-next"
              onClick={handleProceedToConfirm}
              disabled={loading}
              style={{
                flex: 2,
                padding: '0.875rem',
                borderRadius: '10px',
                border: 'none',
                background: '#5E6AD2',
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              下一步
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 'confirm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Success message */}
          {taskId ? (
            <div data-testid="task-submit-success" style={{
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center',
            }}>
              <div style={{
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                background: 'rgba(74, 222, 128, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '2rem',
              }}>
                ✓
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>任務已派發</h2>
              <p style={{ color: '#8A8F98', fontSize: '0.875rem' }}>任務 ID: #{taskId}</p>
              <p style={{ color: '#8A8F98', fontSize: '0.8125rem', marginTop: '1rem' }}>正在跳轉到看板...</p>
            </div>
          ) : (
            <>
              {/* Task Summary Card */}
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '1.5rem',
              }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8A8F98', marginBottom: '1rem' }}>
                  任務摘要
                </h3>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.25rem' }}>任務描述</p>
                  <p style={{ fontSize: '0.9375rem', color: '#EDEDEF', lineHeight: 1.5 }}>{description}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: `${priorityColors[currentPriority]}15`,
                    border: `1px solid ${priorityColors[currentPriority]}30`,
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>優先級 </span>
                    <span data-testid="selected-priority" style={{ fontSize: '0.8125rem', fontWeight: 600, color: priorityColors[currentPriority] }}>
                      {currentPriority}
                    </span>
                  </div>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>類型 </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#EDEDEF' }}>{taskType}</span>
                  </div>
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#8A8F98' }}>指派 </span>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#EDEDEF' }}>travis</span>
                  </div>
                </div>

                {/* Answers summary */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize: '0.75rem', color: '#8A8F98', marginBottom: '0.5rem' }}>回答摘要</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {questions.map(q => {
                      const answer = answers[q.id];
                      const answerText = Array.isArray(answer) ? answer.join(', ') : (answer || '—');
                      return (
                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8125rem', color: '#8A8F98' }}>{q.question}</span>
                          <span style={{ fontSize: '0.8125rem', color: '#EDEDEF' }}>{answerText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {error && (
                <p style={{ color: '#ef4444', fontSize: '0.8125rem' }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  onClick={() => setStep('questions')}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: '#8A8F98',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  上一步
                </button>
                <button
                  data-testid="submit-task"
                  onClick={handleSubmitTask}
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: '0.875rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: loading ? '#5E6AD280' : '#5E6AD2',
                    color: '#fff',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? '派發中...' : '確認派發'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
