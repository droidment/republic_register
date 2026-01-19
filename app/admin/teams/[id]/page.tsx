import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPhone, formatDateTime } from '@/lib/utils'
import DeleteTeamButton from './DeleteTeamButton'
import TeamActions from './TeamActions'

interface PageProps {
  params: Promise<{ id: string }>
}

interface TeamWithDetails {
  id: string
  name: string
  captain_name: string
  captain_phone: string
  captain_email: string | null
  invite_code: string
  created_at: string
  leagues: {
    name: string
    slug: string
  }
  team_players: {
    id: string
    waiver_signed: boolean
    waiver_signed_at: string | null
    lunch_choice: string | null
    lunch_selected_at: string | null
    created_at: string
    players: {
      id: string
      name: string
      email: string
      phone: string
    }
  }[]
}

async function getTeam(id: string): Promise<TeamWithDetails | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      captain_name,
      captain_phone,
      captain_email,
      invite_code,
      created_at,
      leagues(name, slug),
      team_players(
        id,
        waiver_signed,
        waiver_signed_at,
        lunch_choice,
        lunch_selected_at,
        created_at,
        players(id, name, email, phone)
      )
    `)
    .eq('id', id)
    .single()

  return data as unknown as TeamWithDetails
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { id } = await params
  const team = await getTeam(id)

  if (!team) {
    notFound()
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/join/${team.invite_code}`

  const waiversCompleted = team.team_players.filter(tp => tp.waiver_signed).length
  const lunchSelected = team.team_players.filter(tp => tp.lunch_choice).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/teams" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Teams
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{team.name}</h1>
          <p className="text-gray-600">{team.leagues.name}</p>
        </div>
        <DeleteTeamButton teamId={team.id} teamName={team.name} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Info */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Captain</dt>
              <dd className="font-medium text-gray-900">{team.captain_name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="font-medium text-gray-900">{formatPhone(team.captain_phone)}</dd>
            </div>
            {team.captain_email && (
              <div>
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{team.captain_email}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="font-medium text-gray-900">{formatDateTime(team.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Invite Link */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Invite Link</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-2">Invite Code</p>
              <code className="text-2xl font-mono font-bold text-purple-600">
                {team.invite_code}
              </code>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Full Link</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Players</span>
              <span className="text-xl font-bold text-gray-900">
                {team.team_players.length}<span className="text-sm font-normal text-gray-500">/8</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Waivers Signed</span>
              <span className={`text-xl font-bold ${waiversCompleted === team.team_players.length ? 'text-green-600' : 'text-yellow-600'}`}>
                {waiversCompleted}<span className="text-sm font-normal text-gray-500">/{team.team_players.length}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Lunch Selected</span>
              <span className={`text-xl font-bold ${lunchSelected === team.team_players.length ? 'text-green-600' : 'text-yellow-600'}`}>
                {lunchSelected}<span className="text-sm font-normal text-gray-500">/{team.team_players.length}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Send Invites & Reminders */}
      <TeamActions
        teamId={team.id}
        teamName={team.name}
        inviteLink={inviteLink}
        teamPlayers={team.team_players}
      />

      {/* Player Roster */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Player Roster</h2>
        </div>

        {team.team_players.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No players registered yet.</p>
            <p className="text-sm text-gray-400 mt-1">
              Share the invite link with players to let them register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waiver
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lunch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {team.team_players.map((tp) => (
                  <tr key={tp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{tp.players.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatPhone(tp.players.phone)}</p>
                      <p className="text-sm text-gray-500">{tp.players.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tp.waiver_signed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {tp.lunch_choice ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tp.lunch_choice === 'veg'
                            ? 'bg-green-100 text-green-800'
                            : tp.lunch_choice === 'non-veg'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tp.lunch_choice === 'veg' ? 'Veg' : tp.lunch_choice === 'non-veg' ? 'Non-Veg' : 'No Lunch'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(tp.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
