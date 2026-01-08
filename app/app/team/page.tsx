'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMembership } from '@/lib/auth/use-membership'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LocaleProvider, useLocale } from '@/lib/i18n/use-locale'
import { Users, Mail, Trash2, Shield, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TeamMember {
  user_id: string
  email: string
  role: 'ADMIN' | 'MANAGER'
  created_at?: string
  first_name?: string
  last_name?: string
}

interface Invite {
  id: string
  code: string
  expires_at?: string | null
  created_at?: string
  used_at?: string | null
}

interface TeamOverview {
  members: TeamMember[]
  invites: Invite[]
  seats: {
    max_users: number
    used_users: number
    remaining_seats: number
  }
}

function normalizeOverview(data: any): TeamOverview | null {
  // Supabase RPC может вернуть либо { seats, members, invites }, либо { overview: { ... } }
  const raw = data?.overview ?? data
  if (!raw || typeof raw !== 'object') return null

  const members: TeamMember[] = Array.isArray(raw.members) ? raw.members : []
  const invites: Invite[] = Array.isArray(raw.invites) ? raw.invites : []

  // Новый формат: seats {}
  if (raw.seats && typeof raw.seats === 'object') {
    const s = raw.seats
    const max_users = Number(s.max_users ?? 0)
    const used_users = Number(s.used_users ?? 0)
    const remaining_seats = Number(s.remaining_seats ?? 0)

    if (!Number.isFinite(max_users) || !Number.isFinite(used_users) || !Number.isFinite(remaining_seats)) {
      return null
    }

    return { members, invites, seats: { max_users, used_users, remaining_seats } }
  }

  // Старый формат: max_users / members_count / remaining_seats
  const max_users = Number(raw.max_users ?? 0)
  const used_users = Number(raw.used_users ?? raw.members_count ?? members.length ?? 0)
  const remaining_seats = Number(raw.remaining_seats ?? Math.max(max_users - used_users, 0))

  if (!Number.isFinite(max_users) || !Number.isFinite(used_users) || !Number.isFinite(remaining_seats)) {
    return null
  }

  return { members, invites, seats: { max_users, used_users, remaining_seats } }
}

function extractInviteCode(rpcData: any): string | null {
  // create_invite обычно возвращает TABLE(code text)
  // => либо [{ code: '...' }], либо { code: '...' }, либо '...'
  if (!rpcData) return null
  if (typeof rpcData === 'string') return rpcData

  if (Array.isArray(rpcData)) {
    const first = rpcData[0]
    if (first && typeof first === 'object' && typeof first.code === 'string') return first.code
  }

  if (typeof rpcData === 'object' && typeof rpcData.code === 'string') return rpcData.code
  return null
}

function TeamPageContent() {
  const { t } = useLocale()
  const { membership, loading: membershipLoading } = useMembership()
  const { toast } = useToast()

  const [overview, setOverview] = useState<TeamOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = useMemo(() => membership?.role === 'ADMIN', [membership?.role])

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_team_overview')

      console.log('[TEAM OVERVIEW RPC]', { data, error })

      if (error) throw new Error(error.message)

      const normalized = normalizeOverview(data)
      if (!normalized) {
        const keys = data && typeof data === 'object' ? Object.keys(data) : []
        throw new Error(`Invalid RPC shape. Got keys: ${JSON.stringify(keys)}`)
      }

      setOverview(normalized)
    } catch (e: any) {
      console.error('[TEAM OVERVIEW ERROR]', e)
      const msg = e?.message ?? 'Failed to fetch team overview'
      setError(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (membershipLoading) return
    if (!membership) return
    if (!isAdmin) return
    void fetchOverview()
  }, [membershipLoading, membership, isAdmin, fetchOverview])

  const createInvite = async () => {
    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('create_invite', { p_expires_in_hours: 72 })

      console.log('[CREATE INVITE RPC]', { data, error })

      if (error) throw new Error(error.message)

      const code = extractInviteCode(data)
      toast({
        title: 'Invite created',
        description: code ? `Invite code: ${code}` : 'Invite created',
      })

      await fetchOverview()
    } catch (e: any) {
      console.error('[CREATE INVITE ERROR]', e)
      toast({
        title: 'Error',
        description: e?.message ?? 'Failed to create invite',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      const { error } = await supabase.rpc('delete_invite', { p_invite_id: inviteId })

      console.log('[DELETE INVITE RPC]', { error })

      if (error) throw new Error(error.message)

      toast({ title: 'Invite deleted' })
      await fetchOverview()
    } catch (e: any) {
      console.error('[DELETE INVITE ERROR]', e)
      toast({
        title: 'Error',
        description: e?.message ?? 'Failed to delete invite',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const removeMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return

    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      const { error } = await supabase.rpc('remove_member', { p_user_id: userId })

      console.log('[REMOVE MEMBER RPC]', { error })

      if (error) throw new Error(error.message)

      toast({ title: 'Member removed' })
      await fetchOverview()
    } catch (e: any) {
      console.error('[REMOVE MEMBER ERROR]', e)
      toast({
        title: 'Error',
        description: e?.message ?? 'Failed to remove member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (membershipLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!membership) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load membership information</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You do not have permission to access this page. Only administrators can manage team members.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-2">Manage your team members and invitations</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!overview && !error && (
        <div className="text-muted-foreground">{loading ? 'Loading...' : 'No data yet'}</div>
      )}

      {overview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Seats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-2xl font-bold">{overview.seats.used_users}</div>
                  <div className="text-sm text-muted-foreground">Used</div>
                </div>
                <div className="text-muted-foreground">/</div>
                <div>
                  <div className="text-2xl font-bold">{overview.seats.max_users}</div>
                  <div className="text-sm text-muted-foreground">Max</div>
                </div>
                <div className="ml-auto">
                  <div className="text-2xl font-bold text-green-600">{overview.seats.remaining_seats}</div>
                  <div className="text-sm text-muted-foreground">Remaining</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Team Members ({overview.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overview.members.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="min-w-0 flex-1">
                      {member.first_name && member.last_name && (
                        <div className="font-semibold truncate">
                          {member.first_name} {member.last_name}
                        </div>
                      )}
                      <div className={cn('truncate', member.first_name || member.last_name ? 'text-sm' : 'font-medium')}>{member.email}</div>
                      <div className="text-sm text-muted-foreground">{member.role}</div>
                    </div>
                    {member.user_id !== membership.user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.user_id)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Active Invites ({overview.invites.length})
                </CardTitle>
                <Button onClick={createInvite} disabled={loading}>
                  Create Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {overview.invites.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">No active invites</div>
              ) : (
                <div className="space-y-2">
                  {overview.invites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-mono font-medium">{invite.code}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires:{' '}
                          {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'No expiry'}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => deleteInvite(invite.id)} disabled={loading}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default function TeamPage() {
  return (
    <LocaleProvider>
      <TeamPageContent />
    </LocaleProvider>
  )
}