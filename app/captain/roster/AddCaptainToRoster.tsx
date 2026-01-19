'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AddCaptainToRosterProps {
  teamId: string
  captainName: string
  captainEmail: string
  captainPhone: string
  isAlreadyOnRoster: boolean
}

export default function AddCaptainToRoster({
  teamId,
  captainName,
  captainEmail,
  captainPhone,
  isAlreadyOnRoster
}: AddCaptainToRosterProps) {
  const [loading, setLoading] = useState(false)
  const [added, setAdded] = useState(isAlreadyOnRoster)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function addCaptainToRoster() {
    if (added || loading) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const normalizedPhone = captainPhone.replace(/\D/g, '')

      // Check if player with this phone already exists
      let { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('phone', normalizedPhone)
        .single()

      let playerId: string

      if (existingPlayer) {
        playerId = existingPlayer.id
      } else {
        // Create new player record for captain
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({
            name: captainName,
            email: captainEmail.toLowerCase(),
            phone: normalizedPhone,
          })
          .select('id')
          .single()

        if (createError || !newPlayer) {
          console.error('Error creating player:', createError)
          setError('Failed to add captain to roster')
          setLoading(false)
          return
        }

        playerId = newPlayer.id
      }

      // Check if already on this team
      const { data: existingTeamPlayer } = await supabase
        .from('team_players')
        .select('id')
        .eq('player_id', playerId)
        .eq('team_id', teamId)
        .single()

      if (existingTeamPlayer) {
        setAdded(true)
        setLoading(false)
        return
      }

      // Add captain to team roster
      const { error: joinError } = await supabase
        .from('team_players')
        .insert({
          team_id: teamId,
          player_id: playerId,
          added_by: 'captain',
        })

      if (joinError) {
        console.error('Error adding to team:', joinError)
        setError('Failed to add captain to roster')
        setLoading(false)
        return
      }

      setAdded(true)
      setLoading(false)
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  if (added) {
    return null
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-blue-800 font-medium">Add yourself to the roster?</p>
          <p className="text-sm text-blue-600">
            As the team captain, you can add yourself as a player.
          </p>
        </div>
        <button
          onClick={addCaptainToRoster}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Adding...' : 'Add Me to Roster'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
