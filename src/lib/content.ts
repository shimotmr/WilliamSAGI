import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'
import gfm from 'remark-gfm'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeStringify from 'rehype-stringify'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'

// Initialize Supabase client with fallback for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

export interface Post {
  slug: string
  title: string
  date: string
  type: 'digest' | 'research' | 'note' | 'forum' | 'task-update'
  tags: string[]
  cover?: string
  content: string
  excerpt: string
  visibility: 'public' | 'private'
}

// Convert Supabase report to Post format
function reportToPost(report: any): Post {
  const content = report.md_content || report.content || ''
  const { data: frontmatter } = matter(content)
  
  // Extract clean content without frontmatter for excerpt
  const cleanContent = (content || '').replace(/^---[\s\S]*?---\n?/, '')
  
  const excerpt = (cleanContent || '')
    .replace(/^#.*$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
    .slice(0, 200)

  const title = String(report.title || frontmatter?.title || 'Untitled')

  return {
    slug: String(report.id || report.slug || title.toLowerCase().replace(/\s+/g, '-') || ''),
    title,
    date: String(report.date || report.created_at || '2026-01-01'),
    type: String(report.type || frontmatter?.type || 'note'),
    tags: Array.isArray(report.tags) ? report.tags : (frontmatter?.tags || []),
    cover: frontmatter?.cover,
    content: cleanContent,
    excerpt,
    visibility: String(frontmatter?.visibility || 'public'),
  } as Post
}

export async function getAllPosts(): Promise<Post[]> {
  if (!supabase) {
    console.warn('Supabase not initialized - returning empty posts')
    return []
  }
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports from Supabase:', error)
      return []
    }

    const posts = reports?.map(reportToPost) || []
    return posts.sort((a, b) => (a.date > b.date ? -1 : 1))
  } catch (error) {
    console.error('Error in getAllPosts:', error)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!supabase) {
    return null
  }
  try {
    // First try to find by ID (exact match)
    let { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', slug)
      .single()

    // If not found by ID, try by title match
    if (error || !report) {
      const { data: reportByTitle, error: titleError } = await supabase
        .from('reports')
        .select('*')
        .ilike('title', `%${slug.replace('-', ' ')}%`)
        .single()

      if (titleError || !reportByTitle) {
        return null
      }
      report = reportByTitle
    }

    return reportToPost(report)
  } catch (error) {
    console.error('Error in getPostBySlug:', error)
    return null
  }
}

export async function getPublicPosts(): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter(p => p.visibility === 'public')
}

export async function getPrivatePosts(): Promise<Post[]> {
  const posts = await getAllPosts()
  return posts.filter(p => p.visibility === 'private')
}

export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(gfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      theme: 'github-dark',
      keepBackground: true,
      defaultLang: 'plaintext',
      onVisitLine(node: any) {
        // Prevent lines from collapsing in `display: grid` mode, and allow empty lines to be copy/pasted
        if (node.children.length === 0) {
          node.children = [{ type: 'text', value: ' ' }]
        }
      },
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md)
  
  return String(file)
}

export async function getPostsByType(type: string): Promise<Post[]> {
  if (!supabase) {
    return []
  }
  try {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts by type:', error)
      return []
    }

    return reports?.map(reportToPost) || []
  } catch (error) {
    console.error('Error in getPostsByType:', error)
    return []
  }
}