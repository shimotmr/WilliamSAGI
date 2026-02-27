'use client'
import { useState, useEffect } from 'react'

interface Employee { id: number; employee_id: string; name: string; department: string; position: string; ext: string; email: string; mobile: string; hire_date: string }

export default function EmployeesPage() {
  const [q, setQ] = useState('')
  const [dept, setDept] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [depts, setDepts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/portal/employees').then(r=>r.json()).then(d => {
      setEmployees(d.employees || [])
      const ds = [...new Set((d.employees||[]).map((e:Employee)=>e.department?.split('-')[0]).filter(Boolean))] as string[]
      setDepts(ds.sort())
    })
  }, [])

  const filtered = employees.filter(e => {
    const mq = !q || e.name.includes(q) || e.email?.includes(q) || e.department?.includes(q) || e.position?.includes(q)
    const md = !dept || e.department?.startsWith(dept)
    return mq && md
  })

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">員工通訊錄</h1>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="搜尋姓名/部門/職位..."
          className="border rounded-lg px-4 py-2 text-sm flex-1 min-w-[200px]" />
        <select value={dept} onChange={e=>setDept(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">全部部門</option>
          {depts.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <p className="text-xs text-gray-400 mb-4">共 {filtered.length} 筆</p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="p-3 text-left">姓名</th>
              <th className="p-3 text-left">部門</th>
              <th className="p-3 text-left">職位</th>
              <th className="p-3 text-left">分機</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">手機</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(e=>(
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium">{e.name}</td>
                <td className="p-3 text-gray-600 text-xs">{e.department}</td>
                <td className="p-3 text-gray-600">{e.position}</td>
                <td className="p-3 text-gray-500">{e.ext||'-'}</td>
                <td className="p-3"><a href={`mailto:${e.email}`} className="text-blue-600 hover:underline text-xs">{e.email||'-'}</a></td>
                <td className="p-3 text-gray-500">{e.mobile||'-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
