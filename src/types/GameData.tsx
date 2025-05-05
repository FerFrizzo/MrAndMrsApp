import { User } from '@supabase/supabase-js';

export interface GameQuestion {
  id?: string;
  game_id?: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'true_false';
  order_num?: number;
  multiple_choice_options?: string[] | null;
  allow_multiple_selection?: boolean;
}

export interface GameAnswer {
  id?: string;
  question_id: string;
  creator_answer: string | null;
  target_answer: string | null;
  is_match?: boolean;
}

export const GAME_STATUS_MAP = {
  in_creation: 'In Creation',
  ready_to_play: 'Ready to Play',
  completed: 'Completed',
} as const;

export interface GameData {
  // Basic game information
  id?: string;
  creator_id?: string;
  target_email: string;
  target_name: string;
  game_name: string;
  occasion: string;

  // Game settings
  is_premium?: boolean;
  access_code?: string;
  status?: keyof typeof GAME_STATUS_MAP;

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // Related data
  questions?: GameQuestion[];
  answers?: GameAnswer[];

  // Stats and metadata
  target_user_id?: string | null;
  match_score?: number;
  total_questions?: number;
  completed?: boolean;
}

// Type for the dashboard display
export interface GameItem {
  id: string;
  title: string;
  createdAt: string;
  questionCount: number;
  status: string;
  isPremium: boolean;
  colorDot: string;
}

// Response types for game service functions
export interface GameResponse {
  game: GameData | null;
  error: Error | null;
}

export interface GamesResponse {
  games: GameData[] | null;
  error: Error | null;
}

export interface GameResultsResponse {
  game: GameData | null;
  questions: GameQuestion[];
  stats: {
    matchCount: number;
    totalAnswered: number;
    matchPercentage: number;
  };
  error: Error | null;
}

export interface AccessCodeResponse {
  accessCode: string | null;
  error: Error | null;
}

export interface ErrorResponse {
  error: Error | null;
} 