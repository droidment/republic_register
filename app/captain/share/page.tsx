import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ShareLinkClient from './ShareLinkClient'

interface Team {
  id: string
  name: string
  invite_code: string
  leagues: { name: string }
}

async function getCaptainTeam(): Promise<Team | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return null
  }

  const { data } = await supabase
    .from('teams')
    .select('id, name, invite_code, leagues(name)')
    .eq('captain_email', user.email.toLowerCase())
    .single()

  return data as unknown as Team
}

export default async function SharePage() {
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const inviteLink = `${appUrl}/join/${team.invite_code}`

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Share Invite Link</h1>
          <p className="text-gray-600">{team.name} • {team.leagues.name}</p>
        </div>
        <Link
          href="/captain/dashboard"
          className="text-gray-600 hover:text-gray-900"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Invite Link</h2>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Invite Code</p>
              <code className="text-3xl font-mono font-bold text-blue-600">
                {team.invite_code}
              </code>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Full Link</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <ShareLinkClient inviteLink={inviteLink} teamName={team.name} />
      </div>

      <div className="bg-blue-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Share the invite link with your players</li>
          <li>Players click the link and enter their details</li>
          <li>They read and sign the waiver</li>
          <li>They select their lunch preference (Veg/Non-Veg)</li>
          <li>You can track their status on your roster page</li>
        </ol>
      </div>
    </div>
  )
}
