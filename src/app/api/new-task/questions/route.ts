// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'

interface Question {
  id: string;
  type: 'single' | 'multi' | 'text' | 'priority';
  question: string;
  options?: string[];
}

const QUESTION_TEMPLATES: Record<string, Question[]> = {
  分析: [
    {
      id: 'target',
      type: 'single',
      question: '這個分析的對象是？',
      options: ['業務數據', '競品', '市場', '系統效能', '用戶行為'],
    },
    {
      id: 'format',
      type: 'single',
      question: '期望的輸出格式？',
      options: ['報告', '摘要', '表格', '圖表'],
    },
    {
      id: 'priority',
      type: 'priority',
      question: '優先級？',
    },
    {
      id: 'deadline',
      type: 'text',
      question: '有截止時間嗎？',
    },
  ],
  開發: [
    {
      id: 'platform',
      type: 'single',
      question: '開發平台？',
      options: ['Web', 'Mobile', 'API', 'Script', '其他'],
    },
    {
      id: 'language',
      type: 'multi',
      question: '使用的技術？',
      options: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', '其他'],
    },
    {
      id: 'priority',
      type: 'priority',
      question: '優先級？',
    },
    {
      id: 'deadline',
      type: 'text',
      question: '有截止時間嗎？',
    },
  ],
  研究: [
    {
      id: 'topic',
      type: 'text',
      question: '研究的主題是？',
    },
    {
      id: 'scope',
      type: 'single',
      question: '研究範圍？',
      options: ['產業', '技術', '市場', '競爭對手', '趨勢'],
    },
    {
      id: 'priority',
      type: 'priority',
      question: '優先級？',
    },
    {
      id: 'deadline',
      type: 'text',
      question: '有截止時間嗎？',
    },
  ],
  報告: [
    {
      id: 'type',
      type: 'single',
      question: '報告類型？',
      options: ['週報', '月報', '季報', '年報', '專案報告'],
    },
    {
      id: 'audience',
      type: 'single',
      question: '報告對象？',
      options: ['內部', '客戶', '主管', '團隊'],
    },
    {
      id: 'priority',
      type: 'priority',
      question: '優先級？',
    },
    {
      id: 'deadline',
      type: 'text',
      question: '有截止時間嗎？',
    },
  ],
  其他: [
    {
      id: 'priority',
      type: 'priority',
      question: '優先級？',
    },
    {
      id: 'deadline',
      type: 'text',
      question: '有截止時間嗎？',
    },
    {
      id: 'notes',
      type: 'text',
      question: '其他補充說明？',
    },
  ],
};

function detectTaskType(description: string): string {
  const text = description.toLowerCase();
  
  if (text.includes('分析') || text.includes('analytics') || text.includes('analyze') || text.includes('分析')) {
    return '分析';
  }
  if (text.includes('開發') || text.includes('develop') || text.includes('建') || text.includes('implement')) {
    return '開發';
  }
  if (text.includes('研究') || text.includes('research') || text.includes('調查')) {
    return '研究';
  }
  if (text.includes('報告') || text.includes('report') || text.includes('週報') || text.includes('月報')) {
    return '報告';
  }
  
  return '其他';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description } = body;

    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: '缺少任務描述' }, { status: 400 });
    }

    const taskType = detectTaskType(description);
    const questions = QUESTION_TEMPLATES[taskType] || QUESTION_TEMPLATES['其他'];

    return NextResponse.json({
      type: taskType,
      questions,
    });
  } catch (error) {
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}
