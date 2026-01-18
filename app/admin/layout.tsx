'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href: '/admin/teams', label: 'Teams', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { href: '/admin/waiver', label: 'Waiver', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function AdminLayout({
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
      <nav className="bg-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/admin/dashboard" className="font-bold text-lg">
                Republic Day Tournament
              </Link>
              <div className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-purple-800'
                        : 'hover:bg-purple-600'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden bg-purple-600 text-white px-4 py-2 flex space-x-2 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1 rounded-lg whitespace-nowrap text-sm ${
              pathname === item.href || pathname.startsWith(item.href + '/')
                ? 'bg-purple-800'
                : 'hover:bg-purple-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
