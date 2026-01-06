'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMembership } from '@/lib/auth/use-membership'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LocaleProvider, useLocale } from '@/lib/i18n/use-locale'
import { Users, Mail, Trash2, Shield, User, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TeamMember {
  user_id: string
  email: string
  role: 'ADMIN' | 'MANAGER'
  created_at?: string
}

interface Invite {
  id: string
  code: string
  expires_at: string | null
  created_at: string
  used_at?: string | null
}

type TeamOverviewRpc = {
  tenant_id?: string
  max_users?: number
  members_count?: number
  remaining_seats?: number
  members?: TeamMember[]
  invites?: Invite[]
  // на случай если ты потом добавишь алиасы на бэке
  used_users?: number
}

interface TeamOverviewUI {
  members: TeamMember[]
  invites: Invite[]
  seats: {
    max_users: number
    used_users: number
    remaining_seats: number
  }
}

function normalizeOverview(raw: any): TeamOverviewUI {
  // Если вдруг где-то прилетит SQL-формат { get_team_overview: {...} }
  const o: TeamOverviewRpc = raw?.get_team_overview ?? raw ?? {}

  const maxUsers = Number(o.max_users ?? 0)
  const usedUsers = Number(o.used_users ?? o.members_count ?? 0)
  const remainingSeats =
    o.remaining_seats != null ? Number(o.remaining_seats) : Math.max(maxUsers - usedUsers, 0)

  return {
    members: Array.isArray(o.members) ? o.members : [],
    invites: Array.isArray(o.invites) ? o.invites : [],
    seats: {
      max_users: maxUsers,
      used_users: usedUsers,
      remaining_seats: remainingSeats,
    },
  }
}

function TeamPageContent() {
  const { t } = useLocale()
  const { membership, loading: membershipLoading } = useMembership()
  const { toast } = useToast()

  const [overview, setOverview] = useState<TeamOverviewUI | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = useMemo(() => membership?.role === 'ADMIN', [membership?.role])

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_team_overview')

      console.log('[TEAM OVERVIEW RAW]', { data, error })

      if (error) throw new Error(error.message)

      const normalized = normalizeOverview(data)
      setOverview(normalized)
    } catch (e: any) {
      console.error('[TEAM OVERVIEW ERROR]', e)
      const msg = e?.message ?? 'Failed to fetch team overview'
      setError(msg)
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const createInvite = async () => {
    try {
      setLoading(true)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('create_invite', {
        p_expires_in_hours: 72,
      })

      console.log('[CREATE INVITE RAW]', { data, error })

      if (error) throw new Error(error.message)

      // create_invite RETURNS TABLE(code text)
      // supabase обычно вернёт [{ code: '...' }]
      const code =
        Array.isArray(data) ? data?.[0]?.code : (data as any)?.code ?? (typeof data === 'string' ? data : null)

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
      const { error } = await supabase.rpc('delete_invite', {
        p_invite_id: inviteId,
      })

      console.log('[DELETE INVITE]', { error })

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
      const { error } = await supabase.rpc('remove_member', {
        p_user_id: userId,
      })

      console.log('[REMOVE MEMBER]', { error })

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

  // ✅ Нормальный жизненный цикл: грузим overview только когда
  // - membership загрузилась
  // - юзер есть
  // - юзер ADMIN
  useEffect(() => {
    if (membershipLoading) return
    if (!membership) return
    if (!isAdmin) return
    fetchOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipLoading, membership?.user?.id, isAdmin])

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
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {loading ? 'Loading team overview...' : 'No data'}
          </CardContent>
        </Card>
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
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{member.email}</div>
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
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-mono font-medium">{invite.code}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires:{' '}
                          {invite.expires_at ? new Date(invite.expires_at).toLocaleString() : 'Never'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvite(invite.id)}
                        disabled={loading}
                      >
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