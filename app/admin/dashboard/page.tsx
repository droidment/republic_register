import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface LeagueStats {
  id: string
  name: string
  slug: string
  teamCount: number
  playerCount: number
}

interface League {
  id: string
  name: string
  slug: string
}

interface Team {
  id: string
  league_id: string
}

interface TeamPlayer {
  id: string
  team_id: string
  waiver_signed: boolean
  lunch_choice: string | null
  teams: { league_id: string } | null
}

interface DashboardStats {
  totalTeams: number
  totalPlayers: number
  waiversPending: number
  waiversCompleted: number
  lunchVeg: number
  lunchNonVeg: number
  lunchPending: number
  leagueStats: LeagueStats[]
}

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  // Get leagues
  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, slug')
    .order('name')
    .returns<League[]>()

  // Get teams count by league
  const { data: teams } = await supabase
    .from('teams')
    .select('id, league_id')
    .returns<Team[]>()

  // Get all team_players with details
  const { data: teamPlayers } = await supabase
    .from('team_players')
    .select('id, team_id, waiver_signed, lunch_choice, teams(league_id)')
    .returns<TeamPlayer[]>()

  const totalTeams = teams?.length || 0
  const totalPlayers = teamPlayers?.length || 0
  const waiversCompleted = teamPlayers?.filter(tp => tp.waiver_signed).length || 0
  const waiversPending = totalPlayers - waiversCompleted
  const lunchVeg = teamPlayers?.filter(tp => tp.lunch_choice === 'veg').length || 0
  const lunchNonVeg = teamPlayers?.filter(tp => tp.lunch_choice === 'non-veg').length || 0
  const lunchNone = teamPlayers?.filter(tp => tp.lunch_choice === 'none').length || 0
  const lunchPending = totalPlayers - lunchVeg - lunchNonVeg - lunchNone

  // Calculate per-league stats
  const leagueStats: LeagueStats[] = (leagues || []).map(league => {
    const leagueTeams = teams?.filter(t => t.league_id === league.id) || []
    const leagueTeamIds = leagueTeams.map(t => t.id)
    const leaguePlayers = teamPlayers?.filter(tp =>
      leagueTeamIds.includes((tp.teams as { league_id: string })?.league_id === league.id ? tp.team_id : '')
    ) || []

    // Actually count players whose team is in this league
    const playerCount = teamPlayers?.filter(tp => {
      const teamLeagueId = (tp.teams as { league_id: string })?.league_id
      return teamLeagueId === league.id
    }).length || 0

    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      teamCount: leagueTeams.length,
      playerCount,
    }
  })

  return {
    totalTeams,
    totalPlayers,
    waiversPending,
    waiversCompleted,
    lunchVeg,
    lunchNonVeg,
    lunchNone,
    lunchPending,
    leagueStats,
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/admin/teams/new"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          + Add Team
        </Link>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Teams"
          value={stats.totalTeams}
          color="blue"
          icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <StatCard
          title="Total Players"
          value={stats.totalPlayers}
          color="green"
          icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
        <StatCard
          title="Waivers Pending"
          value={stats.waiversPending}
          subtitle={`${stats.waiversCompleted} completed`}
          color="yellow"
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
        <StatCard
          title="Lunch Pending"
          value={stats.lunchPending}
          subtitle={`${stats.lunchVeg} veg, ${stats.lunchNonVeg} non-veg, ${stats.lunchNone} none`}
          color="red"
          icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      {/* League Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">By League</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.leagueStats.map((league) => (
            <div
              key={league.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <h3 className="font-medium text-gray-900">{league.name}</h3>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{league.teamCount}</span> teams
                </p>
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{league.playerCount}</span> players
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lunch Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Lunch Summary</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-700">{stats.lunchVeg}</p>
            <p className="text-sm text-green-600 mt-1">Vegetarian</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-700">{stats.lunchNonVeg}</p>
            <p className="text-sm text-orange-600 mt-1">Non-Vegetarian</p>
          </div>
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <p className="text-3xl font-bold text-gray-700">{stats.lunchPending}</p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string
  value: number
  subtitle?: string
  color: 'blue' | 'green' | 'yellow' | 'red'
  icon: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className={`p-6 rounded-xl border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
        </div>
        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
        </svg>
      </div>
    </div>
  )
}
