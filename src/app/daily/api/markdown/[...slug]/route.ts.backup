import fs from 'fs'
import path from 'path'

import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import { NextRequest, NextResponse } from 'next/server'

const contentDir = path.join(process.cwd(), 'content')

interface PostVisibility {
  slug: string
  visibility: 'public' | 'private' | 'vip'
  markdown_api: boolean
}

function estimateTokens(text: string): number {
  // 粗估：英文 ~4 字符/token，中文 ~2 字符/token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const otherChars = text.length - chineseChars
  return Math.ceil(chineseChars / 2 + otherChars / 4)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  const slug = params.slug.join('/')
  const filePath = path.join(contentDir, `${slug}.md`)

  // 檢查檔案是否存在
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }

  // 讀取檔案
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data: frontmatter, content } = matter(raw)

  // 初始化 Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 檢查權限：先查 DB，沒有的話 fallback 到 frontmatter
  const { data: dbVisibility } = await supabase
    .from('post_visibility')
    .select('visibility, markdown_api')
    .eq('slug', slug)
    .maybeSingle()

  let visibility: string
  let markdownApi: boolean

  if (dbVisibility) {
    visibility = dbVisibility.visibility
    markdownApi = dbVisibility.markdown_api
  } else {
    visibility = frontmatter.visibility || 'public'
    markdownApi = true
  }

  // 如果 markdown_api 被關閉，返回 404
  if (!markdownApi) {
    return NextResponse.json(
      { error: 'Markdown API disabled for this post' },
      { status: 404 }
    )
  }

  // 如果是 private，返回 403
  if (visibility === 'private') {
    return NextResponse.json(
      { error: 'This post is private' },
      { status: 403 }
    )
  }

  // 估算 token 數量
  const tokens = estimateTokens(raw)

  // 返回原始 markdown
  return new NextResponse(raw, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Markdown-Tokens': tokens.toString(),
      'Content-Signal': 'ai-input=yes, search=yes',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
