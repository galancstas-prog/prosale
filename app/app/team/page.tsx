'use client'

import { useEffect, useState } from 'react'
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
  expires_at: string
  created_at: string
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

// RPC response wrapper (как у тебя реально возвращается)
type GetTeamOverviewRpc = { overview: TeamOverview }

function TeamPageContent() {
  const { t } = useLocale()
  const { membership, loading: membershipLoading } = useMembership()
  const { toast } = useToast()

  const [overview, setOverview] = useState<TeamOverview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOverview = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_team_overview')

      console.log('[TEAM OVERVIEW]', { data, error })

      if (error) throw new Error(error.message)
      if (!data) throw new Error('RPC returned no data')

      const wrapped = data as unknown as GetTeamOverviewRpc
      const ov = wrapped?.overview

      if (!ov?.seats) throw new Error('Invalid RPC shape: missing overview.seats')

      setOverview(ov)
    } catch (e: any) {
      console.error('[TEAM OVERVIEW ERROR]', e)
      const msg = e?.message ?? 'Failed to fetch team overview'
      setError(msg)
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const createInvite = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      const { data, error } = await supabase.rpc('create_invite', { p_expires_in_hours: 72 })
      console.log('[CREATE INVITE]', { data, error })
      if (error) throw new Error(error.message)

      // create_invite returns TABLE(code text) -> Supabase обычно даёт массив строк/объектов
      // безопасно обработаем оба варианта:
      const code =
        Array.isArray(data) ? (data[0]?.code ?? JSON.stringify(data[0])) : (data as any)?.code ?? String(data)

      toast({ title: 'Invite created', description: `Invite code: ${code}` })
      await fetchOverview()
    } catch (e: any) {
      console.error('[CREATE INVITE ERROR]', e)
      toast({ title: 'Error', description: e?.message ?? 'Failed to create invite', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const deleteInvite = async (inviteId: string) => {
    try {
      setLoading(true)
      const supabase = getSupabaseClient()

      const { error } = await supabase.rpc('delete_invite', { p_invite_id: inviteId })
      console.log('[DELETE INVITE]', { error })
      if (error) throw new Error(error.message)

      toast({ title: 'Invite deleted' })
      await fetchOverview()
    } catch (e: any) {
      console.error('[DELETE INVITE ERROR]', e)
      toast({ title: 'Error', description: e?.message ?? 'Failed to delete invite', variant: 'destructive' })
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
      console.log('[REMOVE MEMBER]', { error })
      if (error) throw new Error(error.message)

      toast({ title: 'Member removed' })
      await fetchOverview()
    } catch (e: any) {
      console.error('[REMOVE MEMBER ERROR]', e)
      toast({ title: 'Error', description: e?.message ?? 'Failed to remove member', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // грузим 1 раз, когда:
  // - membership загрузилась
  // - user админ
  useEffect(() => {
    if (membershipLoading) return
    if (!membership) return
    if (membership.role !== 'ADMIN') return
    fetchOverview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipLoading, membership?.role])

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

  if (membership.role !== 'ADMIN') {
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
        <div className="text-muted-foreground">Loading team overview…</div>
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
                    <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-mono font-medium">{invite.code}</div>
                        <div className="text-sm text-muted-foreground">
                          Expires: {new Date(invite.expires_at).toLocaleString()}
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