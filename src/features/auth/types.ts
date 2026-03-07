export type SessionRole = 'admin' | 'user'

export interface LoginRequestBody {
  email?: string
  username?: string
  password?: string
}

export interface EmployeeRow {
  emp_code: string
  name: string
  email: string
}

export interface AllowUserRow {
  role: SessionRole | null
}

export interface LoginResult {
  ok: true
  role: SessionRole
  principal: string
}
