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
        target_name: gameData.target_name,
        game_name: gameData.game_name,
        occasion: gameData.occasion,
        is_premium: gameData.is_premium || false,
        privacy_setting: gameData.privacy_setting || 'private',
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
        privacy_setting: gameData.privacy_setting,
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
    console.log('Starting game invite process...');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    console.log('Fetching game details...');
    // Get the game details first
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError) throw gameError;
    if (!game) throw new Error('Game not found');

    console.log('Game found:', { gameId, targetEmail });

    // Generate access code if it doesn't exist
    if (!game.access_code) {
      console.log('Generating new access code...');
      const accessCode = generateRandomCode(6);
      const { error: updateError } = await supabase
        .from('games')
        .update({
          access_code: accessCode,
          status: 'pending'
        })
        .eq('id', gameId);

      if (updateError) throw updateError;
      game.access_code = accessCode;
    }

    console.log('Calling Edge Function...');
    // Call the Edge Function using the Supabase Functions client
    const { data, error } = await supabase.functions.invoke('send-game-invite', {
      body: {
        gameId,
        targetEmail,
        targetName: game.target_name,
        senderId: user.id,
        senderName: user.user_metadata?.full_name || user.email || 'A friend'
      },
    });

    console.log('Edge Function response:', { data, error });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }

    if (!data?.success) {
      console.error('Edge Function unsuccessful:', data);
      throw new Error(data?.message || 'Failed to send invitation');
    }

    console.log('Invitation sent successfully');
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

    console.log('Updating questions for game:', gameId);
    console.log('Total questions:', questions.length);

    // Separate questions into existing ones (to update) and new ones (to insert)
    const existingQuestions = questions.filter(q => q.id);
    const newQuestions = questions.filter(q => !q.id);

    console.log('Existing questions to update:', existingQuestions.length);
    console.log('New questions to insert:', newQuestions.length);
    console.log('Questions to delete:', deletedQuestionIds.length);

    // Log IDs of existing questions for debugging
    if (existingQuestions.length > 0) {
      console.log('Existing question IDs:', existingQuestions.map(q => q.id));
    }

    // Update existing questions
    for (const question of existingQuestions) {
      console.log('Updating question with ID:', question.id);
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
      console.log('Deleting questions with IDs:', deletedQuestionIds);
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .in('id', deletedQuestionIds);

      if (deleteError) {
        console.error('Error deleting questions:', deleteError);
        throw deleteError;
      }
    }

    console.log('Successfully updated all questions');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating game questions:', error);
    return { success: false, error: error as Error };
  }
};

// Update a single question
export const updateQuestion = async (question: GameQuestion): Promise<{ success: boolean, error: Error | null }> => {
  try {
    console.log('Updating question with ID:', question.id, question.question_text);

    if (!question.id) {
      throw new Error('Question ID is required for updates');
    }

    const { error } = await supabase
      .from('questions')
      .update({
        question_text: question.question_text,
        question_type: question.question_type,
        multiple_choice_options: question.multiple_choice_options || false,
        allow_multiple_selection: question.allow_multiple_selection || false
      })
      .eq('id', question.id);

    if (error) {
      console.error('Error updating question:', error);
      throw error;
    }

    console.log('Question updated successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    return { success: false, error: error as Error };
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
        multiple_choice_options: question.multiple_choice_options,
        allow_multiple_selection: question.allow_multiple_selection
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, newQuestion: data, error: null };
  } catch (error) {
    return { success: false, newQuestion: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};