export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  PostgrestVersion: "12"
  public: {
    Tables: {
      organizers: {
        Row: {
          id: string
          email: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          created_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          allow_overlap: boolean
          gender_restriction: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          allow_overlap?: boolean
          gender_restriction?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          allow_overlap?: boolean
          gender_restriction?: string | null
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          league_id: string
          captain_name: string
          captain_email: string | null
          captain_phone: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          league_id: string
          captain_name: string
          captain_email?: string | null
          captain_phone: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          league_id?: string
          captain_name?: string
          captain_email?: string | null
          captain_phone?: string
          invite_code?: string
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
        }
      }
      team_players: {
        Row: {
          id: string
          team_id: string
          player_id: string
          waiver_signed: boolean
          waiver_signed_at: string | null
          signature_url: string | null
          lunch_choice: string | null
          lunch_selected_at: string | null
          added_by: string
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          player_id: string
          waiver_signed?: boolean
          waiver_signed_at?: string | null
          signature_url?: string | null
          lunch_choice?: string | null
          lunch_selected_at?: string | null
          added_by?: string
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          player_id?: string
          waiver_signed?: boolean
          waiver_signed_at?: string | null
          signature_url?: string | null
          lunch_choice?: string | null
          lunch_selected_at?: string | null
          added_by?: string
          created_at?: string
        }
      }
      waiver_content: {
        Row: {
          id: string
          title: string
          content: string
          version: number
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          version?: number
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          version?: number
          active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type League = Database['public']['Tables']['leagues']['Row']
export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type TeamPlayer = Database['public']['Tables']['team_players']['Row']
export type WaiverContent = Database['public']['Tables']['waiver_content']['Row']
export type Organizer = Database['public']['Tables']['organizers']['Row']

// Extended types with relations
export type TeamWithLeague = Team & {
  leagues: League
}

export type TeamPlayerWithDetails = TeamPlayer & {
  players: Player
  teams: TeamWithLeague
}
