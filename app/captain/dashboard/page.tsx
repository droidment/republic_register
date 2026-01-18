import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface TeamWithDetails {
  id: string
  name: string
  captain_name: string
  invite_code: string
  leagues: {
    name: string
  }
  team_players: {
    id: string
    waiver_signed: boolean
    lunch_choice: string | null
    players: {
      name: string
    }
  }[]
}

async function getCaptainTeams(): Promise<TeamWithDetails[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return []
  }

  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      captain_name,
      invite_code,
      leagues(name),
      team_players(
        id,
        waiver_signed,
        lunch_choice,
        players(name)
      )
    `)
    .eq('captain_email', user.email.toLowerCase())

  return (data as unknown as TeamWithDetails[]) || []
}

export default async function CaptainDashboard() {
  const teams = await getCaptainTeams()

  if (teams.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">No Teams Found</h2>
        <p className="mt-2 text-gray-600">
          Your email is not associated with any team. Please contact the tournament organizer.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
        >
          ← Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>

      {teams.map((team) => {
        const playerCount = team.team_players.length
        const waiversPending = team.team_players.filter(tp => !tp.waiver_signed).length
        const lunchPending = team.team_players.filter(tp => !tp.lunch_choice).length

        return (
          <div key={team.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{team.name}</h2>
                  <p className="text-sm text-gray-600">{team.leagues.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Invite Code</p>
                  <code className="text-xl font-mono font-bold text-blue-600">
                    {team.invite_code}
                  </code>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {playerCount}<span className="text-sm font-normal text-gray-500">/8</span>
                  </p>
                  <p className="text-sm text-gray-600">Players</p>
                </div>
                <div className={`text-center p-4 rounded-lg ${waiversPending > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <p className={`text-2xl font-bold ${waiversPending > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {waiversPending}
                  </p>
                  <p className={`text-sm ${waiversPending > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    Waivers Pending
                  </p>
                </div>
                <div className={`text-center p-4 rounded-lg ${lunchPending > 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                  <p className={`text-2xl font-bold ${lunchPending > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {lunchPending}
                  </p>
                  <p className={`text-sm ${lunchPending > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    Lunch Pending
                  </p>
                </div>
              </div>

              {/* Player List Preview */}
              {playerCount > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Players</h3>
                  <div className="flex flex-wrap gap-2">
                    {team.team_players.slice(0, 6).map((tp) => (
                      <span
                        key={tp.id}
                        className={`px-3 py-1 text-sm rounded-full ${
                          tp.waiver_signed && tp.lunch_choice
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {tp.players.name}
                      </span>
                    ))}
                    {playerCount > 6 && (
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
                        +{playerCount - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <Link
                  href="/captain/roster"
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors"
                >
                  Manage Roster
                </Link>
                <Link
                  href="/captain/share"
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-center rounded-lg transition-colors"
                >
                  Share Invite Link
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
