'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validatePlayerCanJoinTeam } from '@/lib/validators'

interface AddPlayerFormProps {
  teamId: string
}

export default function AddPlayerForm({ teamId }: AddPlayerFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const normalizedPhone = phone.replace(/\D/g, '')

    // Validate player can join this team (league restrictions)
    const validation = await validatePlayerCanJoinTeam(normalizedPhone, teamId)
    if (!validation.valid) {
      setError(validation.error || 'Cannot add this player.')
      setLoading(false)
      return
    }

    // Check if player already exists
    let { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('phone', normalizedPhone)
      .single()

    let playerId: string

    if (existingPlayer) {
      playerId = existingPlayer.id
    } else {
      // Create new player
      const { data: newPlayer, error: createError } = await supabase
        .from('players')
        .insert({
          name,
          email,
          phone: normalizedPhone,
        })
        .select('id')
        .single()

      if (createError || !newPlayer) {
        setError(createError?.message || 'Failed to create player.')
        setLoading(false)
        return
      }

      playerId = newPlayer.id
    }

    // Add player to team
    const { error: joinError } = await supabase
      .from('team_players')
      .insert({
        team_id: teamId,
        player_id: playerId,
        added_by: 'captain',
      })

    if (joinError) {
      if (joinError.message.includes('unique constraint')) {
        setError('This player is already on your team.')
      } else {
        setError(joinError.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setName('')
    setEmail('')
    setPhone('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">Player added successfully! They can now complete their waiver and lunch selection using the invite link.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Player Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
            placeholder="234-567-8900"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding...' : 'Add Player'}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Note: Players added here will still need to complete their waiver and lunch selection via the invite link.
      </p>
    </form>
  )
}
