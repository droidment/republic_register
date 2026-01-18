import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPhone } from '@/lib/utils'

interface TeamWithLeague {
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
  team_players: { id: string }[]
}

async function getTeams(): Promise<TeamWithLeague[]> {
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
      team_players(id)
    `)
    .order('created_at', { ascending: false })

  return (data as unknown as TeamWithLeague[]) || []
}

export default async function TeamsPage() {
  const teams = await getTeams()

  // Group teams by league
  const teamsByLeague = teams.reduce((acc, team) => {
    const leagueName = team.leagues.name
    if (!acc[leagueName]) acc[leagueName] = []
    acc[leagueName].push(team)
    return acc
  }, {} as Record<string, TeamWithLeague[]>)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
        <Link
          href="/admin/teams/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          + Add Team
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">No teams yet</h2>
          <p className="mt-2 text-gray-600">Get started by adding your first team.</p>
          <Link
            href="/admin/teams/new"
            className="mt-4 inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Add Team
          </Link>
        </div>
      ) : (
        Object.entries(teamsByLeague).map(([leagueName, leagueTeams]) => (
          <div key={leagueName} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {leagueName}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({leagueTeams.length} {leagueTeams.length === 1 ? 'team' : 'teams'})
                </span>
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {leagueTeams.map((team) => (
                <div key={team.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                      <div className="mt-1 text-sm text-gray-600">
                        <p>
                          Captain: <span className="font-medium">{team.captain_name}</span>
                        </p>
                        <p>
                          Phone: <span className="font-medium">{formatPhone(team.captain_phone)}</span>
                        </p>
                        {team.captain_email && (
                          <p>
                            Email: <span className="font-medium">{team.captain_email}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {team.team_players.length}
                          <span className="text-sm font-normal text-gray-500">/8</span>
                        </p>
                        <p className="text-xs text-gray-500">players</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Invite Code</p>
                        <code className="text-lg font-mono font-bold text-purple-600">
                          {team.invite_code}
                        </code>
                      </div>
                      <Link
                        href={`/admin/teams/${team.id}`}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
