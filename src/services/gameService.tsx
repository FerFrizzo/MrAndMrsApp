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
  GameItem
} from "../types/GameData"

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
        target_email: gameData.target_email,
        game_name: gameData.game_name,
        occasion: gameData.occasion,
        theme: gameData.theme,
        is_premium: gameData.is_premium || false,
        privacy_setting: gameData.privacy_setting || 'private',
        time_limit: gameData.time_limit,
      })
      .select()
      .single()

    console.log('game', game);
    if (gameError) throw gameError
    console.log('gameError', gameError);

    // If there are questions, insert them
    if (gameData.questions && gameData.questions.length > 0) {
      console.log('gameData.questions', gameData.questions);
      const questionsToInsert = gameData.questions.map((q, index) => ({
        game_id: game.id,
        question_text: q.question_text,
        question_type: q.question_type || 'text',
        order_num: index + 1,
        multiple_choice_options: q.multiple_choice_options || null,
      }))

      console.log('questionsToInsert', questionsToInsert);
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
        theme: gameData.theme,
        privacy_setting: gameData.privacy_setting,
        time_limit: gameData.time_limit,
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
          const updateData = isCreator
            ? { creator_answer: answer }
            : {
              target_answer: answer,
              is_match: existingAnswer.creator_answer === answer
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
            creator_answer: isCreator ? answer : null,
            target_answer: isCreator ? null : answer,
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

    return { error: null }
  } catch (error) {
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
      .single()

    if (gameError) throw gameError

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('game_id', gameId)
      .order('order_num', { ascending: true })

    if (questionsError) throw questionsError

    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .in('question_id', questions.map(q => q.id))

    if (answersError) throw answersError

    // Calculate match score
    let matchCount = 0
    let totalAnswered = 0

    // Associate answers with questions and calculate matches
    const questionsWithAnswers = questions.map(question => {
      const answer = answers.find(a => a.question_id === question.id)

      if (answer && answer.creator_answer && answer.target_answer) {
        totalAnswered += 1
        if (answer.creator_answer.toLowerCase() === answer.target_answer.toLowerCase()) {
          matchCount += 1
          answer.is_match = true
        } else {
          answer.is_match = false
        }
      }

      return {
        ...question,
        answer
      }
    })

    return {
      game,
      questions: questionsWithAnswers,
      stats: {
        matchCount,
        totalAnswered,
        matchPercentage: totalAnswered > 0 ? (matchCount / totalAnswered) * 100 : 0
      },
      error: null
    }
  } catch (error) {
    return {
      game: null,
      questions: [],
      stats: {
        matchCount: 0,
        totalAnswered: 0,
        matchPercentage: 0
      },
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

// Get games where user is the target
export const getTargetGames = async (): Promise<GamesResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('target_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { games, error: null }
  } catch (error) {
    return { games: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Join a game as a target
export const joinGame = async (accessCode: string): Promise<GameResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('User not authenticated')

    // Find the game by access code
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('access_code', accessCode)
      .single()

    if (gameError) throw gameError

    // Update the game with the target user id
    const { error: updateError } = await supabase
      .from('games')
      .update({
        target_user_id: user.id,
        updated_at: new Date()
      })
      .eq('id', game.id)

    if (updateError) throw updateError

    return { game, error: null }
  } catch (error) {
    return { game: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

// Get games for the current user
export const getUserGames = async (): Promise<{ games: GameItem[], error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // // Fetch games created by this user
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
    const uid = user.id;
    // const { data: createdGames, error: createdError } = await supabase
    //   .from('games')
    //   .select(`
    //     id,
    //     game_name,
    //     created_at,
    //     is_premium,
    //     status
    //   `)
    //   .eq('creator_id', user.id)
    //   .order('created_at', { ascending: false });

    console.log('createdGames', uid, createdGames, createdError);

    if (createdError) throw createdError;

    // Process the data to include question count
    const formattedGames = createdGames.map(game => ({
      id: game.id,
      title: game.game_name,
      createdAt: new Date(game.created_at).toLocaleDateString(),
      questionCount: game.questions[0]?.count || 0,
      // questionCount: 0,
      status: game.status || 'created',
      isPremium: game.is_premium || false,
      colorDot: getStatusColor(game.status || 'created')
    }));

    return { games: formattedGames, error: null };
  } catch (error) {
    console.error('Error fetching games:', error);
    return { games: [], error: error as Error };
  }
}

// Send game invite with magic link
export const sendGameInvite = async (gameId: string, targetEmail: string): Promise<{ success: boolean, error: Error | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Call Supabase Edge Function to send the email with magic link
    const { data, error } = await supabase.functions.invoke('send-game-invite', {
      body: {
        gameId,
        targetEmail,
        senderId: user.id,
        senderName: user.user_metadata?.display_name || 'A friend'
      }
    });

    if (error) throw error;

    // Generate or update access code for the game
    const accessCode = generateRandomCode(6);
    const { error: updateError } = await supabase
      .from('games')
      .update({
        access_code: accessCode,
        status: 'pending'
      })
      .eq('id', gameId);

    if (updateError) throw updateError;

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