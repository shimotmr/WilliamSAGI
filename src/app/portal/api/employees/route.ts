import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data } = await supabase.from('employees')
    .select('id,employee_id,name,department,title,email,extension,mobile,hire_date,emp_code')
    .order('department', { ascending: true })
    .order('name', { ascending: true })
  // Map field names to what frontend expects
  const employees = (data || []).map(e => ({
    ...e,
    position: e.title,
    ext: e.extension,
  }))
  return NextResponse.json({ employees })
}
