'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CaptainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/captain/dashboard" className="font-bold text-lg">
              Republic Day Tournament
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/captain/dashboard"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/captain/dashboard' ? 'bg-blue-700' : 'hover:bg-blue-500'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/captain/roster"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/captain/roster' ? 'bg-blue-700' : 'hover:bg-blue-500'
                }`}
              >
                Roster
              </Link>
              <Link
                href="/captain/share"
                className={`px-3 py-2 rounded-lg transition-colors ${
                  pathname === '/captain/share' ? 'bg-blue-700' : 'hover:bg-blue-500'
                }`}
              >
                Share Link
              </Link>
              <button
                onClick={handleSignOut}
                className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
