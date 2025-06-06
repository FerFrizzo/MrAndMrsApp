export interface GameQuestion {
  id?: string;
  game_id?: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice' | 'true_false';
  order_num?: number;
  multiple_choice_options?: string[] | null;
  allow_multiple_selection?: boolean;
}

export interface GameQuestionWithAnswer extends GameQuestion {
  answer?: GameAnswer;
}

export interface GameAnswer {
  id?: string;
  question_id: string;
  partner_interviewed_answer: string | null;
  isCorrect?: boolean;
}

export const GAME_STATUS_MAP = {
  in_creation: 'In Creation',
  ready_to_play: 'Ready to Play',
  playing: 'Playing',
  answered: 'Answered',
  results_revealed: 'Results Revealed',
  completed: 'Completed',
} as const;

export function getStatusLabel(status?: string) {
  if (!status) return 'In Creation';
  switch (status) {
    case 'in_creation': return 'In Creation';
    case 'ready_to_play': return 'Ready to Play';
    case 'playing': return 'Playing';
    case 'answered': return 'Answered';
    case 'results_revealed': return 'Results Revealed';
    case 'completed': return 'Completed';
    default: return 'In Creation';
  }
}

export interface GameData {
  // Basic game information
  id?: string;
  creator_id?: string;
  partner_interviewed_email: string;
  partner_interviewed_name: string;
  partner_playing_email?: string;
  partner_playing_name?: string;
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
  partner_interviewed_user_id?: string | null;
  partner_playing_user_id?: string | null;
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
  questionsWithAnswers: GameQuestion[];
  error: Error | null;
}

export interface AccessCodeResponse {
  accessCode: string | null;
  error: Error | null;
}

export interface ErrorResponse {
  error: Error | null;
} 