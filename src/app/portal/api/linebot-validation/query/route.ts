import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 問題分類關鍵字
const PRICE_KEYWORDS = ['價格', '多少錢', '報價', '價錢', '售價', '費用', '多少']
const INVENTORY_KEYWORDS = ['庫存', '現貨', '有貨', '庫餘', '存貨', '現況']
const KNOWLEDGE_KEYWORDS = ['規格', '說明', '介紹', '功能', '手冊', '說明書']

function classifyQuery(text: string): string[] {
  const classifications: string[] = []
  
  if (PRICE_KEYWORDS.some(kw => text.includes(kw))) {
    classifications.push('price')
  }
  if (INVENTORY_KEYWORDS.some(kw => text.includes(kw))) {
    classifications.push('inventory')
  }
  if (KNOWLEDGE_KEYWORDS.some(kw => text.includes(kw))) {
    classifications.push('knowledge')
  }
  
  // 如果沒有匹配，且包含可能的料號格式，預設為價格查詢
  if (classifications.length === 0 && /[A-Z]{2,}[-\d]/i.test(text)) {
    classifications.push('price')
  }
  
  return classifications.length > 0 ? classifications : ['unknown']
}

// 從訊息中提取料號或產品名稱
function extractProductQuery(text: string): string {
  // 移除關鍵字
  let cleaned = text
  ;[...PRICE_KEYWORDS, ...INVENTORY_KEYWORDS, ...KNOWLEDGE_KEYWORDS].forEach(kw => {
    cleaned = cleaned.replace(new RegExp(kw, 'g'), '')
  })
  
  // 清理空白
  return cleaned.trim()
}

// 查詢產品（使用 products_safe 視圖，避免任何成本欄位進入查詢）
async function searchProducts(queryText: string) {
  const { data, error } = await supabase
    .from('products_safe')
    .select(`
      id,
      aurotek_pn,
      pudu_pn,
      name,
      name_en,
      brand,
      list_price,
      currency,
      dealer_price_a,
      dealer_price_b,
      dealer_price_c,
      dealer_price_currency,
      material_type
    `)
    .or(`name.ilike.%${queryText}%,aurotek_pn.ilike.%${queryText}%,pudu_pn.ilike.%${queryText}%,name_en.ilike.%${queryText}%`)
    .limit(10)
  
  if (error) {
    console.error('Product search error:', error)
    return []
  }
  
  return data || []
}

// 查詢庫存並模糊化
async function getInventoryStatus(aurotekPn: string): Promise<string> {
  const { data, error } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('aurotek_pn', aurotekPn)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !data) {
    return '無庫存資訊'
  }
  
  const qty = data.quantity || 0
  
  if (qty === 0) return '無庫存'
  if (qty <= 10) return '庫存緊張'
  return '庫存充足'
}

// 查詢群組政策
async function getGroupPolicy(groupId: string) {
  const { data, error } = await supabase
    .from('line_chat_policies')
    .select('*')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    // 預設政策：tier C，無權限
    return {
      tier: 'C',
      can_show_price: false,
      can_show_inventory: false,
      can_query_knowledge: false,
      group_type: 'unknown'
    }
  }
  
  return data
}

// 依 tier 取得價格
function getPriceByTier(product: any, tier: string): { price: number | null; currency: string } {
  const priceMap: Record<string, string> = {
    'A': 'dealer_price_a',
    'B': 'dealer_price_b',
    'C': 'dealer_price_c'
  }
  
  const priceField = priceMap[tier] || 'dealer_price_c'
  return {
    price: product[priceField] || product.list_price,
    currency: product.dealer_price_currency || product.currency || 'TWD'
  }
}

// 組裝最終回覆
function buildResponse(
  products: any[],
  policy: any,
  classifications: string[],
  inventoryStatuses: Record<string, string>
): string {
  if (products.length === 0) {
    return '❌ 找不到符合的產品，請確認料號或名稱'
  }
  
  const lines: string[] = []
  
  products.forEach((product, idx) => {
    if (products.length > 1) lines.push(`【產品 ${idx + 1}】`)
    
    lines.push(`✅ ${product.name}`)
    if (product.aurotek_pn) lines.push(`料號: ${product.aurotek_pn}`)
    
    // 價格
    if (classifications.includes('price')) {
      if (policy.can_show_price) {
        const { price, currency } = getPriceByTier(product, policy.tier)
        if (price) {
          lines.push(`經銷價: ${currency} ${price.toLocaleString()}`)
        } else {
          lines.push('價格: 請洽業務')
        }
      } else {
        lines.push('價格: 無權限查看')
      }
    }
    
    // 庫存
    if (classifications.includes('inventory')) {
      if (policy.can_show_inventory) {
        const status = inventoryStatuses[product.id] || '無庫存資訊'
        lines.push(`庫存: ${status}`)
      } else {
        lines.push('庫存: 無權限查看')
      }
    }
    
    lines.push('')
  })
  
  return lines.join('\n').trim()
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await req.json()
    const { query, group_id = 'test-validation-group' } = body
    
    if (!query) {
      return NextResponse.json({ error: '缺少查詢參數' }, { status: 400 })
    }
    
    // 1. 分類查詢
    const classifications = classifyQuery(query)
    
    // 2. 提取產品關鍵字
    const productQuery = extractProductQuery(query)
    
    // 3. 查詢產品
    const products = await searchProducts(productQuery)
    
    // 4. 查詢群組政策
    const policy = await getGroupPolicy(group_id)
    
    // 5. 查詢庫存狀態（如果需要）
    const inventoryStatuses: Record<string, string> = {}
    if (classifications.includes('inventory') && policy.can_show_inventory) {
      for (const product of products) {
        inventoryStatuses[product.id] = await getInventoryStatus(product.aurotek_pn)
      }
    }
    
    // 6. 組裝回覆
    const finalResponse = buildResponse(products, policy, classifications, inventoryStatuses)
    
    // 7. 記錄查詢日誌
    const elapsed = Date.now() - startTime
    await supabase.from('line_query_logs').insert({
      group_id,
      query_text: query,
      classification: classifications.join('+'),
      matched_products: products.map(p => ({
        id: p.id,
        name: p.name,
        aurotek_pn: p.aurotek_pn
        // 不包含價格等敏感資訊
      })),
      policy_tier: policy.tier,
      response_sent: finalResponse,
      elapsed_ms: elapsed
    })
    
    // 8. 返回結果（debug 用，但排除成本欄位）
    return NextResponse.json({
      success: true,
      query,
      classification: classifications,
      product_query: productQuery,
      products: products.map(p => ({
        ...p,
        // 確保不暴露成本（雖然查詢時已排除，但雙重保險）
        cost: undefined,
        cost_currency: undefined
      })),
      policy: {
        tier: policy.tier,
        can_show_price: policy.can_show_price,
        can_show_inventory: policy.can_show_inventory,
        can_query_knowledge: policy.can_query_knowledge,
        group_type: policy.group_type
      },
      inventory_status: inventoryStatuses,
      final_response: finalResponse,
      elapsed_ms: elapsed
    })
    
  } catch (error) {
    console.error('Validation API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤',
      elapsed_ms: Date.now() - startTime
    }, { status: 500 })
  }
}
