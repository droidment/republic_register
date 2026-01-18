'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'
import type { League } from '@/lib/supabase/types'

export default function NewTeamPage() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [name, setName] = useState('')
  const [leagueId, setLeagueId] = useState('')
  const [captainName, setCaptainName] = useState('')
  const [captainPhone, setCaptainPhone] = useState('')
  const [captainEmail, setCaptainEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchLeagues() {
      const supabase = createClient()
      const { data } = await supabase
        .from('leagues')
        .select('*')
        .order('name')

      if (data) {
        setLeagues(data)
        if (data.length > 0) {
          setLeagueId(data[0].id)
        }
      }
    }
    fetchLeagues()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // Generate unique invite code
    const inviteCode = generateInviteCode()

    const { error: insertError } = await supabase.from('teams').insert({
      name,
      league_id: leagueId,
      captain_name: captainName,
      captain_phone: captainPhone ? captainPhone.replace(/\D/g, '') : '',
      captain_email: captainEmail.toLowerCase(),
      invite_code: inviteCode,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/admin/teams')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Add New Team</h1>
        <Link
          href="/admin/teams"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Teams
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="league" className="block text-sm font-medium text-gray-700">
              League *
            </label>
            <select
              id="league"
              required
              value={leagueId}
              onChange={(e) => setLeagueId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Team Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Thunder Spikes"
            />
          </div>

          <hr className="my-6" />

          <h3 className="text-lg font-medium text-gray-900">Captain Details</h3>

          <div>
            <label htmlFor="captainName" className="block text-sm font-medium text-gray-700">
              Captain Name *
            </label>
            <input
              id="captainName"
              type="text"
              required
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., John Smith"
            />
          </div>

          <div>
            <label htmlFor="captainEmail" className="block text-sm font-medium text-gray-700">
              Captain Email *
            </label>
            <input
              id="captainEmail"
              type="email"
              required
              value={captainEmail}
              onChange={(e) => setCaptainEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., captain@example.com"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be used for captain login via magic link
            </p>
          </div>

          <div>
            <label htmlFor="captainPhone" className="block text-sm font-medium text-gray-700">
              Captain Phone Number (optional)
            </label>
            <input
              id="captainPhone"
              type="tel"
              value={captainPhone}
              onChange={(e) => setCaptainPhone(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., +1 234 567 8900"
            />
            <p className="mt-1 text-xs text-gray-500">
              For WhatsApp/contact purposes
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Link
              href="/admin/teams"
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
