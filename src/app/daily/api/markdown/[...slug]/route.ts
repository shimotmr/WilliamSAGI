import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';

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

  // 初始化 Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 從 Supabase reports 表查找對應的報告
    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', slug)
      .single()

    if (error || !report) {
      // 如果沒找到，嘗試用標題匹配
      const { data: reportByTitle, error: titleError } = await supabase
        .from('reports')
        .select('*')
        .eq('title', slug)
        .single()

      if (titleError || !reportByTitle) {
        return NextResponse.json(
          { error: 'Post not found' },
          { status: 404 }
        )
      }
      
      // 使用標題匹配的結果
      Object.assign(report, reportByTitle)
    }

    // 構建 markdown 內容，包含 frontmatter
    let markdownContent = report.md_content || report.content || ''
    
    // 如果 md_content 不包含 frontmatter，則添加
    if (markdownContent && !markdownContent.startsWith('---')) {
      const frontmatter = {
        title: report.title,
        author: report.author,
        date: report.date || report.created_at,
        type: report.type,
        export_status: report.export_status
      }

      const frontmatterYaml = Object.entries(frontmatter)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')

      markdownContent = `---\n${frontmatterYaml}\n---\n\n${markdownContent}`
    }

    // 解析 frontmatter 以獲取權限設定
    const { data: frontmatter } = matter(markdownContent)

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
    const tokens = estimateTokens(markdownContent)

    // 返回原始 markdown
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Markdown-Tokens': tokens.toString(),
        'Content-Signal': 'ai-input=yes, search=yes',
        'Cache-Control': 'public, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Error fetching report from Supabase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}