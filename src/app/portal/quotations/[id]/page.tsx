'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface QuotationItem { id: string; aurotek_pn: string; product_name: string; product_spec: string; quantity: number; unit_price: number; discount_percent: number; line_total: number; notes: string }

const STATUS_MAP: Record<string,string> = {'草稿':'bg-gray-100 text-gray-500','已送出':'bg-blue-100 text-blue-700','已接受':'bg-green-100 text-green-700','已拒絕':'bg-red-100 text-red-400','已過期':'bg-yellow-100 text-yellow-600'}

export default function QuotationDetailPage() {
  const { id } = useParams<{id:string}>()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [items, setItems] = useState<QuotationItem[]>([])

  useEffect(() => {
    fetch(`/api/portal/quotations/${id}`).then(r=>r.json()).then(d=>{
      setQuote(d.quote); setItems(d.items||[])
    })
  }, [id])

  if (!quote) return <div className="p-6 text-gray-400">載入中...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={()=>router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-2 block">← 返回列表</button>
          <h1 className="text-2xl font-bold">報價單 {quote.quotation_no}</h1>
          <p className="text-gray-500 text-sm mt-1">{quote.quote_date} 發出 · 有效至 {quote.valid_until}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_MAP[quote.status]||'bg-gray-100'}`}>{quote.status}</span>
      </div>

      {/* 客戶資訊 */}
      <div className="bg-white rounded-xl shadow p-5 mb-4">
        <h2 className="font-semibold mb-3 text-sm text-gray-500 uppercase">客戶資訊</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-gray-400 text-xs">公司名稱</p><p className="font-medium">{quote.customer_name}</p></div>
          <div><p className="text-gray-400 text-xs">聯絡人</p><p>{quote.customer_contact||'-'}</p></div>
          <div><p className="text-gray-400 text-xs">電話</p><p>{quote.customer_phone||'-'}</p></div>
          <div><p className="text-gray-400 text-xs">Email</p><p>{quote.customer_email||'-'}</p></div>
        </div>
      </div>

      {/* 品項明細 */}
      <div className="bg-white rounded-xl shadow overflow-hidden mb-4">
        <div className="px-5 py-3 border-b"><h2 className="font-semibold">品項明細</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left">料號</th>
              <th className="p-3 text-left">產品名稱</th>
              <th className="p-3 text-right">數量</th>
              <th className="p-3 text-right">單價</th>
              <th className="p-3 text-right">折扣</th>
              <th className="p-3 text-right">小計</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item=>(
              <tr key={item.id}>
                <td className="p-3 text-xs font-mono text-gray-500">{item.aurotek_pn}</td>
                <td className="p-3">
                  <p className="font-medium">{item.product_name}</p>
                  {item.product_spec && <p className="text-xs text-gray-400">{item.product_spec}</p>}
                </td>
                <td className="p-3 text-right">{item.quantity}</td>
                <td className="p-3 text-right">{quote.currency} {item.unit_price?.toLocaleString()}</td>
                <td className="p-3 text-right text-gray-500">{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
                <td className="p-3 text-right font-medium">{quote.currency} {item.line_total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* 合計 */}
        <div className="px-5 py-4 border-t bg-gray-50 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">小計</span><span>{quote.currency} {quote.subtotal?.toLocaleString()}</span></div>
          {quote.discount_amount > 0 && <div className="flex justify-between text-red-500"><span>折扣</span><span>-{quote.currency} {quote.discount_amount?.toLocaleString()}</span></div>}
          {quote.tax_amount > 0 && <div className="flex justify-between text-gray-500"><span>稅金 ({quote.tax_percent}%)</span><span>{quote.currency} {quote.tax_amount?.toLocaleString()}</span></div>}
          <div className="flex justify-between font-bold text-base pt-2 border-t"><span>總計</span><span>{quote.currency} {quote.total_amount?.toLocaleString()}</span></div>
        </div>
      </div>

      {/* 備註 */}
      {(quote.notes || quote.terms) && (
        <div className="bg-white rounded-xl shadow p-5 text-sm space-y-3">
          {quote.notes && <div><p className="text-xs text-gray-400 uppercase mb-1">備註</p><p className="text-gray-600">{quote.notes}</p></div>}
          {quote.terms && <div><p className="text-xs text-gray-400 uppercase mb-1">付款條件</p><p className="text-gray-600">{quote.terms}</p></div>}
        </div>
      )}
    </div>
  )
}
