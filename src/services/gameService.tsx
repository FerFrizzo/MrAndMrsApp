// src/services/gameService.js
import { supabase } from "../config/supabaseClient"
import { getStatusColor } from "../utils/Colors"
import {
  GameData,
  GameQuestion,
  GameResponse,
  GamesResponse,
  GameResultsResponse,
  AccessCodeResponse,
  ErrorResponse,
  GameItem,
  GameAnswer
} from "../types/GameData"
import { Platform } from "react-native"

// Create a new game
export const createGame = async (gameData: GameData): Promise<GameResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Insert the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        creator_id: user.id,
        partner_interviewed_email: gameData.partner_interviewed_email,
        partner_interviewed_name: gameData.partner_interviewed_name,
        partner_playing_email: gameData.partner_playing_email,
        partner_playing_name: gameData.partner_playing_name,
        game_name: gameData.game_name,
        occasion: gameData.occasion,
        is_premium: gameData.is_premium || false,
        status: 'in_creation',
      })
      .select()
      .single()

    if (gameError) throw gameError

    // If there are questions, insert them
    if (gameData.questions && gameData.questions.length > 0) {

      const questionsToInsert = gameData.questions.map((q, index) => ({
        game_id: game.id,
        question_text: q.question_text,
        question_type: q.question_type || 'text',
        order_num: index + 1,
        multiple_choice_options: q.multiple_choice_options || null,
        allow_multiple_selection: q.allow_multiple_selection || false
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError
    }

    return { game, error: null }
  } catch (error) {
    console.error('Error creating game:', error)
    return { game: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Get games created by the current user
export const getCreatedGames = async (): Promise<GamesResponse> => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        questions:questions(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { games, error: null }
  } catch (error) {
    return { games: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Get a specific game with its questions
export const getGameWithQuestions = async (gameId: string): Promise<GameResponse> => {
  try {
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single()

    if (gameError) throw gameError

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('game_id', gameId)
      .order('order_num', { ascending: true })

    if (questionsError) throw questionsError

    game.questions = questions

    return { game, error: null }
  } catch (error) {
    return { game: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Update a game
export const updateGame = async (gameId: string, gameData: Partial<GameData>): Promise<ErrorResponse> => {
  try {
    const { error } = await supabase
      .from('games')
      .update({
        game_name: gameData.game_name,
        occasion: gameData.occasion,
        updated_at: new Date(),
      })
      .eq('id', gameId)

    if (error) throw error
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Generate a shareable link/code for a game
export const generateGameAccessCode = async (gameId: string): Promise<AccessCodeResponse> => {
  try {
    // Generate a random 6-character code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabase
      .from('games')
      .update({ access_code: accessCode })
      .eq('id', gameId)

    if (error) throw error
    return { accessCode, error: null }
  } catch (error) {
    return { accessCode: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Submit answers to questions
export const submitAnswers = async (gameId: string, answers: Record<string, string>, isCreator = true): Promise<ErrorResponse> => {
  try {
    // Before submitting answers, if target is starting and status is 'ready_to_play', set to 'playing'
    if (!isCreator) {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('status')
        .eq('id', gameId)
        .single();
      if (gameError) throw gameError;
      if (game.status === 'ready_to_play') {
        await supabase
          .from('games')
          .update({ status: 'playing' })
          .eq('id', gameId);
      }
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('game_id', gameId)

    if (questionsError) throw questionsError

    const answerInserts = []

    // For each answer, find the matching question and prepare insert
    for (const [questionIndex, answer] of Object.entries(answers)) {
      if (questions[parseInt(questionIndex)]) {
        const questionId = questions[parseInt(questionIndex)].id

        // Check if answer exists first
        const { data: existingAnswer, error: checkError } = await supabase
          .from('answers')
          .select('*')
          .eq('question_id', questionId)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          throw checkError
        }

        if (existingAnswer) {
          // Update existing answer
          const updateData = {
            partner_interviewed_answer: answer
          }

          const { error: updateError } = await supabase
            .from('answers')
            .update(updateData)
            .eq('id', existingAnswer.id)

          if (updateError) throw updateError
        } else {
          // Insert new answer
          answerInserts.push({
            question_id: questionId,
            partner_interviewed_answer: isCreator ? null : answer,
          })
        }
      }
    }

    // Insert any new answers
    if (answerInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('answers')
        .insert(answerInserts)

      if (insertError) throw insertError
    }

    // --- NEW LOGIC: Set game status to answered when target submits answers ---
    if (!isCreator) {
      await supabase
        .from('games')
        .update({ status: 'answered' })
        .eq('id', gameId);
    }
    // --- END NEW LOGIC ---

    return { error: null }
  } catch (error) {
    console.error('Error submitting answers:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Get game results
export const getGameResults = async (gameId: string): Promise<GameResultsResponse> => {
  try {
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('game_id', gameId)
      .order('order_num', { ascending: true });

    if (questionsError) throw questionsError;

    const questionIds = questions.map((q) => q.id);

    // Fetch all answers for these questions, ordered by question_id and created_at DESC
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questionIds)
      .order('question_id', { ascending: true })
      .order('created_at', { ascending: false });

    if (answersError) throw answersError;

    // Only keep the most recent answer for each question_id
    const latestAnswersMap = new Map<string, GameAnswer>();
    for (const answer of answers as GameAnswer[]) {
      if (!latestAnswersMap.has(answer.question_id)) {
        latestAnswersMap.set(answer.question_id, answer);
      }
    }

    const questionsWithAnswers: (GameQuestion & { answer?: GameAnswer })[] = (questions as GameQuestion[]).map((question) => {
      const answer = latestAnswersMap.get(question.id!);

      return {
        ...question,
        answer,
      };
    });

    const gameResultsResponse: GameResultsResponse = {
      game: game as GameData,
      questionsWithAnswers: questionsWithAnswers,
      error: null,
    }

    return gameResultsResponse;
  } catch (error) {
    return {
      game: null,
      questionsWithAnswers: [],
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

// Get games for the current user
export const getUserGames = async (): Promise<{ createdGames: GameItem[], partnerInterviewedGames: GameItem[], error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Fetch games created by this user
    const { data: createdGames, error: createdError } = await supabase
      .from('games')
      .select(`
        id,
        game_name,
        created_at,
        is_premium,
        status,
        questions(count)
      `)
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (createdError) throw createdError;

    // Fetch games where user is the partner interviewed (by email)
    const { data: partnerInterviewedGames, error: partnerInterviewedError } = await supabase
      .from('games')
      .select(`
        id,
        game_name,
        created_at,
        is_premium,
        status,
        questions(count)
      `)
      .eq('partner_interviewed_email', user.email)
      .in('status', ['ready_to_play', 'playing', 'answered', 'completed'])
      .order('created_at', { ascending: false });

    if (partnerInterviewedError) throw partnerInterviewedError;

    // Process created games
    const formattedCreatedGames = createdGames.map(game => ({
      id: game.id,
      title: game.game_name,
      createdAt: new Date(game.created_at).toLocaleDateString(),
      questionCount: game.questions[0]?.count || 0,
      status: game.status || 'created',
      isPremium: game.is_premium || false,
      colorDot: getStatusColor(game.status || 'created')
    }));

    // Process partner interviewed games
    const formattedPartnerInterviewedGames = partnerInterviewedGames.map(game => ({
      id: game.id,
      title: game.game_name,
      createdAt: new Date(game.created_at).toLocaleDateString(),
      questionCount: game.questions[0]?.count || 0,
      status: game.status || 'created',
      isPremium: game.is_premium || false,
      colorDot: getStatusColor(game.status || 'created')
    }));

    return {
      createdGames: formattedCreatedGames,
      partnerInterviewedGames: formattedPartnerInterviewedGames,
      error: null
    };
  } catch (error) {
    console.error('Error fetching games:', error);
    return {
      createdGames: [],
      partnerInterviewedGames: [],
      error: error as Error
    };
  }
};

// Send game invite with magic link
export const sendGameInvite = async (gameId: string, partnerInterviewedEmail: string): Promise<{ success: boolean, error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get the game details first
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;
    if (!game) throw new Error('Game not found');

    // Generate access code if it doesn't exist
    if (!game.access_code) {
      const accessCode = generateRandomCode(6);
      const { error: updateError } = await supabase
        .from('games')
        .update({
          access_code: accessCode,
          status: 'ready_to_play'
        })
        .eq('id', gameId);

      if (updateError) throw updateError;
      game.access_code = accessCode;
    }

    // Call the Edge Function using the Supabase Functions client
    const { data, error } = await supabase.functions.invoke('send-game-invite', {
      body: {
        gameId,
        partnerInterviewedEmail,
        partnerInterviewedName: game.partner_interviewed_name,
        creatorId: user.id,
        creatorName: user.user_metadata?.full_name || user.email || 'A friend',
        platform: Platform.OS
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }

    if (!data?.success) {
      console.error('Edge Function unsuccessful:', data);
      throw new Error(data?.message || 'Failed to send invitation');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error sending game invite:', error);
    return { success: false, error: error as Error };
  }
};

// Generate a random code for game access
function generateRandomCode(length: number): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar-looking characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Update questions for a game
export const updateGameQuestions = async (
  gameId: string,
  questions: GameQuestion[],
  deletedQuestionIds: string[] = []
): Promise<{ success: boolean, error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Separate questions into existing ones (to update) and new ones (to insert)
    const existingQuestions = questions.filter(q => q.id);
    const newQuestions = questions.filter(q => !q.id);

    // Update existing questions
    for (const question of existingQuestions) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          question_text: question.question_text,
          question_type: question.question_type,
          multiple_choice_options: question.multiple_choice_options || null,
          allow_multiple_selection: question.allow_multiple_selection || false
        })
        .eq('id', question.id);

      if (updateError) {
        console.error('Error updating question:', updateError);
        throw updateError;
      }
    }

    // Insert new questions
    if (newQuestions.length > 0) {
      const questionsWithGameId = newQuestions.map((question, index) => ({
        game_id: gameId,
        question_text: question.question_text,
        question_type: question.question_type,
        order_num: existingQuestions.length + index + 1,
        multiple_choice_options: question.multiple_choice_options || null,
        allow_multiple_selection: question.allow_multiple_selection || false
      }));

      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsWithGameId);

      if (insertError) {
        console.error('Error inserting new questions:', insertError);
        throw insertError;
      }
    }

    // Delete questions
    if (deletedQuestionIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .in('id', deletedQuestionIds);

      if (deleteError) {
        console.error('Error deleting questions:', deleteError);
        throw deleteError;
      }
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating game questions:', error);
    return { success: false, error: error as Error };
  }
};

// Update a single question
export const updateQuestion = async (question: GameQuestion): Promise<{ success: boolean, error: Error | null }> => {
  try {

    if (!question.id) {
      throw new Error('Question ID is required for updates');
    }

    const { error } = await supabase
      .from('questions')
      .update({
        question_text: question.question_text,
        question_type: question.question_type,
        multiple_choice_options: question.multiple_choice_options || null,
        allow_multiple_selection: question.allow_multiple_selection || false
      })
      .eq('id', question.id);

    if (error) {
      console.error('Supabase error updating question:', error);
      throw new Error(error.message || 'Failed to update question');
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const deleteQuestion = async (questionId: string): Promise<{ success: boolean, error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

export const createQuestion = async (question: GameQuestion): Promise<{ success: boolean, newQuestion: GameQuestion | null, error: Error | null }> => {
  try {

    const { data, error } = await supabase
      .from('questions')
      .insert({
        game_id: question.game_id,
        question_text: question.question_text,
        question_type: question.question_type,
        multiple_choice_options: question.multiple_choice_options || null,
        allow_multiple_selection: question.allow_multiple_selection || false
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating question:', error);
      throw new Error(error.message || 'Failed to create question');
    }

    return { success: true, newQuestion: data, error: null };
  } catch (error) {
    console.error('Error in createQuestion:', error);
    return { success: false, newQuestion: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

// Save a single answer for a question (target user)
export async function saveSingleAnswer(gameId: string, questionId: string, answer: string): Promise<{ error: Error | null }> {
  try {
    // Check if answer exists

    const { data: existingAnswer, error: checkError } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .single();
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    if (existingAnswer) {
      // Update existing answer
      const { error: updateError } = await supabase
        .from('answers')
        .update({ partner_interviewed_answer: answer })
        .eq('id', existingAnswer.id);
      if (updateError) throw updateError;
    } else {
      // Insert new answer
      const { error: insertError } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          partner_interviewed_answer: answer,
        });
      if (insertError) throw insertError;
    }
    return { error: null };
  } catch (error) {
    console.error('Error in saveSingleAnswer:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function updateAnswerCorrectness(answerId: string, isCorrect: boolean): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('answers')
      .update({ isCorrect })
      .eq('id', answerId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating answer correctness:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}

export async function completeGame(gameId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('games')
      .update({ status: 'completed', updated_at: new Date() })
      .eq('id', gameId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}