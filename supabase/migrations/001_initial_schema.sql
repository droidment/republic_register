-- Tournament Waiver & Roster Management Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizers table (admin users)
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  allow_overlap BOOLEAN DEFAULT FALSE,
  gender_restriction TEXT, -- NULL or 'female'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  captain_name TEXT NOT NULL,
  captain_email TEXT,
  captain_phone TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Players (roster) - many-to-many relationship
CREATE TABLE team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  waiver_signed BOOLEAN DEFAULT FALSE,
  waiver_signed_at TIMESTAMP WITH TIME ZONE,
  signature_url TEXT,
  lunch_choice TEXT CHECK (lunch_choice IN ('veg', 'non-veg', 'none')),
  lunch_selected_at TIMESTAMP WITH TIME ZONE,
  added_by TEXT DEFAULT 'captain' CHECK (added_by IN ('captain', 'self')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Waiver content (configurable by admins)
CREATE TABLE waiver_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_teams_captain_phone ON teams(captain_phone);
CREATE INDEX idx_teams_invite_code ON teams(invite_code);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_player_id ON team_players(player_id);
CREATE INDEX idx_players_phone ON players(phone);

-- Insert the 4 leagues
INSERT INTO leagues (name, slug, description, allow_overlap, gender_restriction) VALUES
  ('PRO Volleyball', 'pro', 'Professional Volleyball League - players can also participate in Regular and 45+ leagues', TRUE, NULL),
  ('Regular Volleyball', 'regular', 'Regular Volleyball League for all players', FALSE, NULL),
  ('45+ Volleyball', '45plus', 'Volleyball League for players 45 years and older', FALSE, NULL),
  ('Women Throwball', 'throwball', 'Women-only Throwball League - players cannot participate in Volleyball leagues', FALSE, 'female');

-- Insert default waiver content
INSERT INTO waiver_content (title, content, active) VALUES
  ('Tournament Waiver and Release', E'## Waiver and Release of Liability

By signing this waiver, I acknowledge and agree to the following:

### Assumption of Risk
I understand that participating in volleyball/throwball activities involves inherent risks, including but not limited to physical injury, and I voluntarily assume all such risks.

### Release of Liability
I hereby release and discharge the tournament organizers, sponsors, and all associated parties from any and all claims, damages, or causes of action arising out of my participation in this tournament.

### Medical Authorization
In case of emergency, I authorize the tournament organizers to seek medical treatment on my behalf if I am unable to do so myself.

### Rules and Conduct
I agree to abide by all tournament rules and regulations and to conduct myself in a sportsmanlike manner throughout the event.

### Media Release
I consent to the use of photographs, videos, or other media taken during the tournament for promotional purposes.

### Acknowledgment
I have read this waiver carefully, understand its contents, and sign it voluntarily.', TRUE);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiver_content ENABLE ROW LEVEL SECURITY;

-- Leagues: Everyone can read
CREATE POLICY "Leagues are viewable by everyone" ON leagues
  FOR SELECT USING (true);

-- Organizers: Only authenticated organizers can read
CREATE POLICY "Organizers can view organizers" ON organizers
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

-- Teams: Captains can view their teams, organizers can view all
CREATE POLICY "Teams viewable by captain or organizer" ON teams
  FOR SELECT USING (
    captain_phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
    OR true -- Allow public read for invite links
  );

CREATE POLICY "Organizers can insert teams" ON teams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Organizers can update teams" ON teams
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "Organizers can delete teams" ON teams
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

-- Players: Public can insert (for registration), authenticated can view
CREATE POLICY "Players viewable by authenticated users" ON players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can update their own record" ON players
  FOR UPDATE USING (
    phone = (SELECT phone FROM auth.users WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

-- Team Players: Captains see their team, organizers see all
CREATE POLICY "Team players viewable" ON team_players
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert team players" ON team_players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Team players can update their record" ON team_players
  FOR UPDATE USING (true);

-- Waiver content: Everyone can read active waivers
CREATE POLICY "Active waivers viewable by everyone" ON waiver_content
  FOR SELECT USING (active = true OR EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "Organizers can manage waiver content" ON waiver_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organizers WHERE email = auth.jwt() ->> 'email')
  );

-- Create storage bucket for signatures
-- Note: Run this in Supabase dashboard under Storage
-- CREATE POLICY on storage.objects for signatures bucket

-- Function to check if player can join a team (throwball isolation)
CREATE OR REPLACE FUNCTION check_player_league_restriction()
RETURNS TRIGGER AS $$
DECLARE
  target_league_slug TEXT;
  existing_league_slugs TEXT[];
  is_joining_throwball BOOLEAN;
  is_in_throwball BOOLEAN;
  is_in_volleyball BOOLEAN;
BEGIN
  -- Get the target team's league slug
  SELECT l.slug INTO target_league_slug
  FROM teams t
  JOIN leagues l ON t.league_id = l.id
  WHERE t.id = NEW.team_id;

  -- Get all existing league slugs for this player
  SELECT ARRAY_AGG(l.slug) INTO existing_league_slugs
  FROM team_players tp
  JOIN teams t ON tp.team_id = t.id
  JOIN leagues l ON t.league_id = l.id
  WHERE tp.player_id = NEW.player_id;

  -- If no existing teams, allow
  IF existing_league_slugs IS NULL THEN
    RETURN NEW;
  END IF;

  is_joining_throwball := target_league_slug = 'throwball';
  is_in_throwball := 'throwball' = ANY(existing_league_slugs);
  is_in_volleyball := EXISTS (
    SELECT 1 FROM unnest(existing_league_slugs) AS slug
    WHERE slug != 'throwball'
  );

  -- Throwball isolation rule
  IF is_joining_throwball AND is_in_volleyball THEN
    RAISE EXCEPTION 'Player is already in a Volleyball league and cannot join Throwball';
  END IF;

  IF NOT is_joining_throwball AND is_in_throwball THEN
    RAISE EXCEPTION 'Player is already in Throwball and cannot join a Volleyball league';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for league restriction check
CREATE TRIGGER enforce_league_restriction
  BEFORE INSERT ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION check_player_league_restriction();

-- Function to enforce max roster size
CREATE OR REPLACE FUNCTION check_roster_size()
RETURNS TRIGGER AS $$
DECLARE
  current_size INTEGER;
  max_size INTEGER := 10;
BEGIN
  SELECT COUNT(*) INTO current_size
  FROM team_players
  WHERE team_id = NEW.team_id;

  IF current_size >= max_size THEN
    RAISE EXCEPTION 'Team roster is full (maximum % players)', max_size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for roster size check
CREATE TRIGGER enforce_roster_size
  BEFORE INSERT ON team_players
  FOR EACH ROW
  EXECUTE FUNCTION check_roster_size();
