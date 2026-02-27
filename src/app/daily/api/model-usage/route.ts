import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://example.supabase.co') {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'summary'

    switch (type) {
      case 'recent': {
        // Get recent usage records
        const { data, error } = await supabase
          .from('model_usage')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        return NextResponse.json({
          status: 'success',
          data: data || [],
          count: data?.length || 0
        })
      }

      case 'by-agent': {
        // Get usage grouped by agent
        const { data, error } = await supabase
          .from('model_usage_agent_ranking')
          .select('*')
          .order('total_cost', { ascending: false })
          .limit(10)

        if (error) throw error

        return NextResponse.json({
          status: 'success',
          data: data || [],
          count: data?.length || 0
        })
      }

      case 'quotas': {
        // Get model quotas
        const { data, error } = await supabase
          .from('model_quotas')
          .select('*')
          .order('model_provider', { ascending: true })

        if (error) throw error

        return NextResponse.json({
          status: 'success',
          data: data || [],
          count: data?.length || 0
        })
      }

      case 'summary':
      default: {
        // Get summary with multiple data points
        const [usageRes, quotasRes, agentRes] = await Promise.all([
          supabase
            .from('model_usage')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('model_quotas')
            .select('*'),
          supabase
            .from('model_usage_agent_ranking')
            .select('*')
            .order('total_cost', { ascending: false })
            .limit(5)
        ])

        // Calculate totals
        const usage = usageRes.data || []
        const totalTokensIn = usage.reduce((sum, r) => sum + (r.tokens_in || 0), 0)
        const totalTokensOut = usage.reduce((sum, r) => sum + (r.tokens_out || 0), 0)
        const totalCost = usage.reduce((sum, r) => sum + (r.cost_usd || 0), 0)
        const totalPrompts = usage.reduce((sum, r) => sum + (r.prompt_count || 0), 0)

        return NextResponse.json({
          status: 'success',
          data: {
            recent: usage,
            quotas: quotasRes.data || [],
            top_agents: agentRes.data || [],
            summary: {
              total_tokens_in: totalTokensIn,
              total_tokens_out: totalTokensOut,
              total_tokens: totalTokensIn + totalTokensOut,
              total_cost: totalCost,
              total_prompts: totalPrompts,
              record_count: usage.length
            }
          }
        })
      }
    }
  } catch (error) {
    console.error('Model Usage API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
