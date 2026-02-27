'use client'

import { ArrowLeft, Shield, UserCheck, UserX, Clock, Crown, Users, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserRecord {
  id: string
  auth_user_id: string
  github_username: string
  avatar_url: string
  role: 'owner' | 'member' | 'pending'
  created_at: string
  updated_at: string
}

const roleBadge: Record<string, { label: string; color: string; icon: typeof Crown }> = {
  owner: { label: 'Owner', color: 'bg-purple-500/10 text-purple-500', icon: Crown },
  member: { label: 'Member', color: 'bg-green-500/10 text-green-500', icon: UserCheck },
  pending: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-500', icon: Clock },
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      const data = await res.json()
      setUsers(data.users || [])
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const updateRole = async (userId: string, newRole: 'member' | 'pending') => {
    setUpdating(userId)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newRole }),
    })
    await fetchUsers()
    setUpdating(null)
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('zh-TW', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const pendingUsers = users.filter(u => u.role === 'pending')
  const approvedUsers = users.filter(u => u.role !== 'pending')

  return (
    <div className="py-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={16} /> Back to feed
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
          <Shield size={20} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Manage user access and roles</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="border border-border rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Pending approvals */}
          {pendingUsers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-yellow-500" />
                <h2 className="font-semibold">Pending Approval ({pendingUsers.length})</h2>
              </div>
              <div className="space-y-2">
                {pendingUsers.map(u => (
                  <UserCard
                    key={u.id}
                    user={u}
                    updating={updating === u.id}
                    onApprove={() => updateRole(u.id, 'member')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Approved users */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users size={16} className="text-foreground" />
              <h2 className="font-semibold">Users ({approvedUsers.length})</h2>
            </div>
            <div className="space-y-2">
              {approvedUsers.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  updating={updating === u.id}
                  onRevoke={u.role === 'member' ? () => updateRole(u.id, 'pending') : undefined}
                />
              ))}
            </div>
          </div>

          {users.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <UserCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p>No users yet</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function UserCard({
  user,
  updating,
  onApprove,
  onRevoke,
}: {
  user: UserRecord
  updating: boolean
  onApprove?: () => void
  onRevoke?: () => void
}) {
  const badge = roleBadge[user.role]
  const BadgeIcon = badge.icon

  return (
    <div className="border border-border rounded-xl bg-card p-4 hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3">
        {user.avatar_url ? (
          <img src={user.avatar_url} alt={user.github_username} className="w-10 h-10 rounded-full shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
            {user.github_username[0]?.toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{user.github_username}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1 ${badge.color}`}>
              <BadgeIcon size={10} />
              {badge.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Joined {new Date(user.created_at).toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={updating}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <UserCheck size={14} />
              <span className="hidden sm:inline">Approve</span>
            </button>
          )}
          {onRevoke && (
            <button
              onClick={onRevoke}
              disabled={updating}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <UserX size={14} />
              <span className="hidden sm:inline">Revoke</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
