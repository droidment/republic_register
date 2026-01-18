import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPhone, formatDateTime } from '@/lib/utils'
import AddPlayerForm from './AddPlayerForm'

interface TeamWithPlayers {
  id: string
  name: string
  leagues: { name: string }
  team_players: {
    id: string
    waiver_signed: boolean
    waiver_signed_at: string | null
    lunch_choice: string | null
    created_at: string
    players: {
      id: string
      name: string
      email: string
      phone: string
    }
  }[]
}

async function getCaptainTeam(): Promise<TeamWithPlayers | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return null
  }

  const { data } = await supabase
    .from('teams')
    .select(`
      id,
      name,
      leagues(name),
      team_players(
        id,
        waiver_signed,
        waiver_signed_at,
        lunch_choice,
        created_at,
        players(id, name, email, phone)
      )
    `)
    .eq('captain_email', user.email.toLowerCase())
    .single()

  return data as unknown as TeamWithPlayers
}

export default async function RosterPage() {
  const team = await getCaptainTeam()

  if (!team) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <p className="text-gray-600">No team found.</p>
        <Link href="/captain/dashboard" className="text-blue-600 hover:text-blue-700 mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    )
  }

  const canAddMore = team.team_players.length < 8

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
          <p className="text-gray-600">{team.leagues.name} • {team.team_players.length}/8 players</p>
        </div>
        <Link
          href="/captain/dashboard"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Add Player Form */}
      {canAddMore && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Player</h2>
          <AddPlayerForm teamId={team.id} />
        </div>
      )}

      {!canAddMore && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            Your roster is full (8 players maximum). Remove a player to add someone new.
          </p>
        </div>
      )}

      {/* Player Roster */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Player Roster</h2>
        </div>

        {team.team_players.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="mt-4 text-gray-500">No players registered yet.</p>
            <p className="text-sm text-gray-400">Add players above or share your invite link.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {team.team_players.map((tp) => (
              <div key={tp.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{tp.players.name}</h3>
                    <div className="mt-1 text-sm text-gray-500 space-x-4">
                      <span>{formatPhone(tp.players.phone)}</span>
                      <span>{tp.players.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Waiver Status */}
                    <div className="text-center">
                      {tp.waiver_signed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Waiver Signed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Waiver Pending
                        </span>
                      )}
                    </div>
                    {/* Lunch Status */}
                    <div className="text-center">
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
                          Lunch Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(!tp.waiver_signed || !tp.lunch_choice) && (
                  <p className="mt-2 text-xs text-yellow-600">
                    Remind this player to complete their registration.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
