import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

const AUDIENCE_PROMPTS: Record<string, string> = {
  'internal': '這是給內部團隊的簡報，語氣專業但較為輕鬆，可以包含內部數據和流程。',
  'client-technical': '這是給技術背景客戶的簡報，需要詳細的技術說明和數據支援。',
  'client-general': '這是給一般客戶的簡報，使用淺顯易懂的語言，重點放在價值和效益。',
  'executive': '這是給高層主管的簡報，簡潔有力，重點在ROI和策略價值。',
  'investor': '這是給投資人的簡報，強調市場機會、財務預測和成長潛力。',
  'partner': '這是給合作夥伴的簡報，強調雙贏策略和長期合作價值。',
}

// 初始化 Google Auth
function getGoogleAuth() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // 從 credentials 檔案載入 token
  const credentials = require('fs').readFileSync(
    require('os').homedir() + '/.openclaw/credentials/google-oauth.json',
    'utf-8'
  )
  const token = JSON.parse(credentials)

  oauth2Client.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  })

  return oauth2Client
}

export async function POST(request: NextRequest) {
  try {
    const { topic, audience } = await request.json()

    if (!topic || !audience) {
      return NextResponse.json(
        { error: '請提供簡報主題和目標受眾' },
        { status: 400 }
      )
    }

    const auth = getGoogleAuth()
    const slides = google.slides({ version: 'v1', auth })

    // 根據目標受眾調整內容提示
    const audiencePrompt = AUDIENCE_PROMPTS[audience] || ''
    
    // 建立簡報
    const presentation = await slides.presentations.create({
      requestBody: {
        title: `${topic} - AI生成簡報`,
      },
    })

    const presentationId = presentation.data.presentationId

    if (!presentationId) {
      throw new Error('無法建立簡報')
    }

    // 取得簡報連結
    const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`

    return NextResponse.json({
      id: presentationId,
      title: topic,
      slidesUrl,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('生成簡報錯誤:', error)
    return NextResponse.json(
      { error: '生成簡報失敗，請稍後重試' },
      { status: 500 }
    )
  }
}
