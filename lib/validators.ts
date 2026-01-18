import { createClient } from '@/lib/supabase/client'

interface ValidationResult {
  valid: boolean
  error?: string
}

interface TeamWithLeague {
  id: string
  leagues: {
    slug: string
    name: string
  }
}

/**
 * Validates if a player can join a team based on league restrictions:
 * - PRO volleyball players can also play in Regular or 45+ leagues
 * - Throwball players CANNOT be in any Volleyball team (and vice versa)
 * - Players can be in multiple volleyball teams (across different leagues)
 */
export async function validatePlayerCanJoinTeam(
  playerPhone: string,
  targetTeamId: string
): Promise<ValidationResult> {
  const supabase = createClient()

  // Get the target team's league
  const { data: targetTeam, error: teamError } = await supabase
    .from('teams')
    .select('id, leagues(slug, name)')
    .eq('id', targetTeamId)
    .single()

  if (teamError || !targetTeam) {
    return { valid: false, error: 'Team not found' }
  }

  const typedTargetTeam = targetTeam as unknown as TeamWithLeague
  const targetLeagueSlug = typedTargetTeam.leagues.slug

  // Find if this player already exists
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('phone', playerPhone)
    .single()

  // If player doesn't exist yet, they can join any team
  if (!existingPlayer) {
    return { valid: true }
  }

  // Get all teams this player is currently in
  const { data: playerTeams, error: teamsError } = await supabase
    .from('team_players')
    .select('teams(id, leagues(slug, name))')
    .eq('player_id', existingPlayer.id)

  if (teamsError) {
    return { valid: false, error: 'Error checking player teams' }
  }

  if (!playerTeams || playerTeams.length === 0) {
    return { valid: true }
  }

  // Check league restrictions
  const isJoiningThrowball = targetLeagueSlug === 'throwball'
  const existingLeagues = playerTeams.map(
    pt => (pt.teams as unknown as TeamWithLeague['leagues']).slug
  )

  const isInThrowball = existingLeagues.includes('throwball')
  const isInVolleyball = existingLeagues.some(slug => slug !== 'throwball')

  // Throwball isolation rule
  if (isJoiningThrowball && isInVolleyball) {
    return {
      valid: false,
      error: 'This player is already registered in a Volleyball league and cannot join Throwball. Throwball is for women players not participating in Volleyball.',
    }
  }

  if (!isJoiningThrowball && isInThrowball) {
    return {
      valid: false,
      error: 'This player is already registered in Throwball and cannot join a Volleyball league. Throwball players cannot participate in Volleyball.',
    }
  }

  // Check if already in this specific team
  const { data: existingRegistration } = await supabase
    .from('team_players')
    .select('id')
    .eq('player_id', existingPlayer.id)
    .eq('team_id', targetTeamId)
    .single()

  if (existingRegistration) {
    return {
      valid: false,
      error: 'This player is already registered in this team.',
    }
  }

  // All checks passed
  return { valid: true }
}

/**
 * Server-side validation (for use in API routes/server actions)
 */
export async function validatePlayerCanJoinTeamServer(
  supabase: ReturnType<typeof createClient>,
  playerPhone: string,
  targetTeamId: string
): Promise<ValidationResult> {
  // Get the target team's league
  const { data: targetTeam, error: teamError } = await supabase
    .from('teams')
    .select('id, leagues(slug, name)')
    .eq('id', targetTeamId)
    .single()

  if (teamError || !targetTeam) {
    return { valid: false, error: 'Team not found' }
  }

  const typedTargetTeam = targetTeam as unknown as TeamWithLeague
  const targetLeagueSlug = typedTargetTeam.leagues.slug

  // Find if this player already exists
  const { data: existingPlayer } = await supabase
    .from('players')
    .select('id')
    .eq('phone', playerPhone)
    .single()

  if (!existingPlayer) {
    return { valid: true }
  }

  // Get all teams this player is currently in
  const { data: playerTeams, error: teamsError } = await supabase
    .from('team_players')
    .select('teams(id, leagues(slug, name))')
    .eq('player_id', existingPlayer.id)

  if (teamsError) {
    return { valid: false, error: 'Error checking player teams' }
  }

  if (!playerTeams || playerTeams.length === 0) {
    return { valid: true }
  }

  const isJoiningThrowball = targetLeagueSlug === 'throwball'
  const existingLeagues = playerTeams.map(
    pt => (pt.teams as unknown as TeamWithLeague['leagues']).slug
  )

  const isInThrowball = existingLeagues.includes('throwball')
  const isInVolleyball = existingLeagues.some(slug => slug !== 'throwball')

  if (isJoiningThrowball && isInVolleyball) {
    return {
      valid: false,
      error: 'This player is already registered in a Volleyball league and cannot join Throwball.',
    }
  }

  if (!isJoiningThrowball && isInThrowball) {
    return {
      valid: false,
      error: 'This player is already registered in Throwball and cannot join a Volleyball league.',
    }
  }

  const { data: existingRegistration } = await supabase
    .from('team_players')
    .select('id')
    .eq('player_id', existingPlayer.id)
    .eq('team_id', targetTeamId)
    .single()

  if (existingRegistration) {
    return {
      valid: false,
      error: 'This player is already registered in this team.',
    }
  }

  return { valid: true }
}
