// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employee_id')
  if (!employeeId) return NextResponse.json({ error: 'employee_id required' }, { status: 400 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase
    .from('employees')
    .select('emp_code,name,email,department,position')
    .or(`emp_code.eq.${employeeId},email.ilike.${employeeId}@%`)
    .single()
  if (!data) return NextResponse.json({ error: '找不到員工' }, { status: 404 })
  return NextResponse.json(data)
}
