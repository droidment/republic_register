import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PlayerRegistrationForm from './PlayerRegistrationForm'

interface PageProps {
  params: Promise<{ inviteCode: string }>
}

interface TeamWithWaiver {
  id: string
  name: string
  invite_code: string
  leagues: {
    name: string
    slug: string
  }
  team_players: { id: string }[]
}

interface WaiverContent {
  id: string
  title: string
  content: string
}

async function getTeamByInviteCode(inviteCode: string): Promise<TeamWithWaiver | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      invite_code,
      leagues(name, slug),
      team_players(id)
    `)
    .eq('invite_code', inviteCode)
    .single()

  return data as unknown as TeamWithWaiver
}

async function getActiveWaiver(): Promise<WaiverContent | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('waiver_content')
    .select('id, title, content')
    .eq('active', true)
    .single()

  return data
}

export default async function JoinTeamPage({ params }: PageProps) {
  const { inviteCode } = await params
  const team = await getTeamByInviteCode(inviteCode)

  if (!team) {
    notFound()
  }

  const waiver = await getActiveWaiver()
  const isFull = team.team_players.length >= 8

  if (isFull) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Team is Full</h1>
          <p className="mt-2 text-gray-600">
            Sorry, <strong>{team.name}</strong> has reached the maximum roster size of 8 players.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please contact your team captain for more information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Join Team</h1>
          <div className="mt-2 inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
            <span className="text-lg font-semibold text-blue-800">{team.name}</span>
            <span className="mx-2 text-blue-300">•</span>
            <span className="text-blue-700">{team.leagues.name}</span>
          </div>
        </div>

        <PlayerRegistrationForm
          teamId={team.id}
          teamName={team.name}
          leagueSlug={team.leagues.slug}
          waiver={waiver}
        />
      </div>
    </div>
  )
}
