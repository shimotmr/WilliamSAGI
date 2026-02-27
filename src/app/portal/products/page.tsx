'use client'
import { useState, useEffect } from 'react'

interface Product { id: string; aurotek_pn: string; name: string; name_en: string; brand: string; list_price: number; currency: string; material_type: string }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [brand, setBrand] = useState('')
  const [brands, setBrands] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/portal/products').then(r=>r.json()).then(d=>{
      setProducts(d.products||[])
      setBrands([...new Set((d.products||[]).map((p:Product)=>p.brand).filter(Boolean))] as string[])
    })
  }, [])

  const filtered = products.filter(p => {
    const mq = !q || p.name.includes(q) || p.aurotek_pn?.includes(q) || p.name_en?.toLowerCase().includes(q.toLowerCase())
    const mb = !brand || p.brand === brand
    return mq && mb
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">產品目錄</h1>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋產品名稱/料號..."
          className="flex-1 border rounded-lg px-4 py-2 text-sm min-w-[200px]" />
        <select value={brand} onChange={e=>setBrand(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">全部品牌</option>
          {brands.map(b=><option key={b}>{b}</option>)}
        </select>
      </div>
      <p className="text-xs text-gray-400 mb-4">共 {filtered.length} 筆</p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left">品牌</th>
              <th className="p-3 text-left">料號</th>
              <th className="p-3 text-left">產品名稱</th>
              <th className="p-3 text-left">英文名</th>
              <th className="p-3 text-right">定價</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p=>(
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3"><span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{p.brand}</span></td>
                <td className="p-3 text-gray-500 text-xs font-mono">{p.aurotek_pn}</td>
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-gray-500 text-xs">{p.name_en}</td>
                <td className="p-3 text-right font-medium">{p.list_price ? `${p.currency} ${p.list_price.toLocaleString()}` : '-'}</td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={5} className="p-6 text-center text-gray-400">無資料</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
