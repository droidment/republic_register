'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface PlayerActionsProps {
  teamPlayerId: string
  playerId: string
  playerName: string
  playerPhone: string
  playerEmail: string
  waiverSigned: boolean
  lunchChoice: string | null
}

export default function PlayerActions({
  teamPlayerId,
  playerId,
  playerName,
  playerPhone,
  playerEmail,
  waiverSigned,
  lunchChoice
}: PlayerActionsProps) {
  // Captain can only edit/delete players who haven't completed waiver AND lunch selection
  const canModify = !waiverSigned && !lunchChoice
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [name, setName] = useState(playerName)
  const [email, setEmail] = useState(playerEmail)
  const [phone, setPhone] = useState(playerPhone)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleUpdatePlayer(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const normalizedPhone = phone.replace(/\D/g, '')

    const { error: updateError } = await supabase
      .from('players')
      .update({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizedPhone
      })
      .eq('id', playerId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setShowEditModal(false)
    setLoading(false)
    router.refresh()
  }

  async function handleRemovePlayer() {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // First verify the record exists
      const { data: existing } = await supabase
        .from('team_players')
        .select('id')
        .eq('id', teamPlayerId)
        .single()

      if (!existing) {
        setError('Player record not found. Please refresh the page.')
        setLoading(false)
        return
      }

      const { error: deleteError } = await supabase
        .from('team_players')
        .delete()
        .eq('id', teamPlayerId)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        setError(deleteError.message || 'Failed to remove player. Please try again.')
        setLoading(false)
        return
      }

      setShowRemoveModal(false)
      setLoading(false)
      router.refresh()
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // If player has completed waiver or lunch, don't show action buttons
  if (!canModify) {
    return null
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowEditModal(true)}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit player details"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={() => setShowRemoveModal(true)}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Remove from team"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Edit Player Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Player Details
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Update information for this player. Changes can only be made before they complete their waiver and food selection.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleUpdatePlayer} className="space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400 bg-white"
                  placeholder="234-567-8900"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setName(playerName)
                    setEmail(playerEmail)
                    setPhone(playerPhone)
                    setError(null)
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Player Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Player
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to remove <strong>{playerName}</strong> from your team?
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRemoveModal(false)
                  setError(null)
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemovePlayer}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Removing...' : 'Remove Player'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
