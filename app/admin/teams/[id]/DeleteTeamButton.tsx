'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteTeamButtonProps {
  teamId: string
  teamName: string
}

export default function DeleteTeamButton({ teamId, teamName }: DeleteTeamButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (error) {
      alert('Failed to delete team: ' + error.message)
      setLoading(false)
      return
    }

    router.push('/admin/teams')
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900">Delete Team?</h3>
          <p className="mt-2 text-gray-600">
            Are you sure you want to delete <strong>{teamName}</strong>? This will also remove all player registrations for this team. This action cannot be undone.
          </p>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Deleting...' : 'Delete Team'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
    >
      Delete Team
    </button>
  )
}
