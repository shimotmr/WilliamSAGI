import { getSupabaseServerClient } from '@/lib/supabase/server'
import type {
  AllowUserRow,
  EmployeeRow,
  LoginRequestBody,
  LoginResult,
  SessionRole,
} from '../types'

const ZIMBRA_HOST = process.env.ZIMBRA_HOST || 'https://webmail.aurotek.com'

export async function loginWithDirectory(body: LoginRequestBody): Promise<LoginResult> {
  const input = body.email || body.username
  const password = body.password

  if (!input || !password) {
    throw new Error('Missing fields')
  }

  const account = input.trim().toLowerCase()
  const supabase = getSupabaseServerClient()

  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('emp_code, name, email')
    .or(`emp_code.eq.${account},email.ilike.${account}@%`)
    .single<EmployeeRow>()

  if (employeeError || !employee) {
    throw new Error('帳號不存在，請確認工號是否正確')
  }

  let zimbraOk = false

  try {
    const zimbraUser = (employee.email || employee.emp_code).split('@')[0]
    const cred = Buffer.from(`${zimbraUser}:${password}`).toString('base64')

    const resp = await fetch(`${ZIMBRA_HOST}/home/${zimbraUser}/inbox?fmt=json&limit=1`, {
      headers: {
        Authorization: `Basic ${cred}`,
      },
      cache: 'no-store',
    })

    zimbraOk = resp.ok
  } catch {
    zimbraOk = false
  }

  if (!zimbraOk) {
    throw new Error('密碼錯誤')
  }

  const { data: allowUser } = await supabase
    .from('allow_users')
    .select('role')
    .or(
      `email.eq.${employee.emp_code},email.eq.${employee.email},email.eq.${employee.emp_code}@aurotek.com`
    )
    .single<AllowUserRow>()

  const role: SessionRole = allowUser?.role === 'admin' ? 'admin' : 'user'

  return {
    ok: true,
    role,
    principal: employee.email || employee.emp_code,
  }
}
