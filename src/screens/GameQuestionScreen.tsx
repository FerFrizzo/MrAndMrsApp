import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { Purple, PurpleLight } from '../utils/Colors';
import { getGameWithQuestions, submitAnswers, saveSingleAnswer, saveAnswerWithMedia } from '../services/gameService';
import { GameQuestion, GameData } from '../types/GameData';
import { MediaFile } from '../services/mediaService';
import MediaUpload from '../components/MediaUpload';
import { useToast } from '../contexts/ToastContext';
import { z } from 'zod';

interface AnswerMap {
  [questionId: string]: string | string[] | boolean;
}

interface MediaMap {
  [questionId: string]: MediaFile | null;
}

type GameQuestionScreenProps = NativeStackScreenProps<RootStackParamList, 'GameQuestion'>;

function GameQuestionScreen({ route, navigation }: GameQuestionScreenProps) {
  const { gameId } = route.params;
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [mediaFiles, setMediaFiles] = useState<MediaMap>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  

  useEffect(() => {
    fetchQuestions();
  }, [gameId]);

  async function fetchQuestions() {
    setLoading(true);
    setError(null);
    try {
      const { game, error } = await getGameWithQuestions(gameId);
      
      if (error || !game?.questions) throw error || new Error('No questions found');
      setQuestions(game.questions);
      setGame(game);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }

  function handleAnswerChange(value: string | string[] | boolean) {
    const q = questions[current];
    if (!q?.id) return;
    setAnswers((prev) => ({ ...prev, [q.id!]: value }));
  }

  function handleMediaSelect(media: MediaFile | null) {
    const q = questions[current];
    if (!q?.id) return;
    setMediaFiles((prev) => ({ ...prev, [q.id!]: media }));
  }

  // Validation result type
  interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
  }

  // Answer value type union
  type AnswerValue = string | string[] | boolean | undefined | null;

  // Centralized validation function
  const validateQuestion = useCallback((
    question: GameQuestion, 
    answer: AnswerValue, 
    mediaFile: MediaFile | null
  ): ValidationResult => {
    const isPremium: boolean = game?.is_paid === 'premium';
    
    // For premium games, media is sufficient
    if (isPremium && mediaFile) {
      return { isValid: true };
    }
    
    // For all other cases, validate based on question type
    switch (question.question_type) {
      case 'text': {
        const textAnswer: string = answer as string;
        if (!textAnswer || textAnswer.trim() === '') {
          return { isValid: false, errorMessage: 'Text answer required' };
        }
        break;
      }
        
      case 'true_false': {
        const booleanAnswer: boolean = answer as boolean;
        if (booleanAnswer === undefined || booleanAnswer === null) {
          return { isValid: false, errorMessage: 'True/False answer required' };
        }
        break;
      }
        
      case 'multiple_choice': {
        if (question.allow_multiple_selection) {
          const arrayAnswer: string[] = answer as string[];
          if (!Array.isArray(arrayAnswer) || arrayAnswer.length === 0) {
            return { isValid: false, errorMessage: 'Select at least one option' };
          }
        } else {
          const singleAnswer: string = answer as string;
          if (!singleAnswer || singleAnswer.trim() === '') {
            return { isValid: false, errorMessage: 'Select one option' };
          }
        }
        break;
      }
    }
    
    return { isValid: true };
  }, [game?.is_paid]);

  async function handleNext(): Promise<void> {
    if (saving) return;
    
    const q: GameQuestion = questions[current];
    if (!q?.id) {
      return;
    }
    
    const answer: AnswerValue = answers[q.id!];
    const mediaFile: MediaFile | null = mediaFiles[q.id!];
    
    const validation: ValidationResult = validateQuestion(q, answer, mediaFile);
    
    if (!validation.isValid) {
      const errorMessage: string = validation.errorMessage || 'Answer required';
      setError(`Please answer this question before proceeding. ${errorMessage}`);
      return;
    }
    
    setSaving(true);
    setError(null);
    
    let answerStr: string = '';
    if (q.question_type === 'multiple_choice' && q.allow_multiple_selection) {
      const arrayAnswer: string[] = answer as string[];
      answerStr = Array.isArray(arrayAnswer) ? arrayAnswer.join(',') : '';
    } else if (typeof answer === 'boolean') {
      const booleanAnswer: boolean = answer as boolean;
      answerStr = booleanAnswer ? 'true' : 'false';
    } else {
      const textAnswer: string = answer as string;
      answerStr = textAnswer;
    }
    
    const currentMediaFile: MediaFile | null = mediaFiles[q.id!];
    
    try {
      let saveError;
      
      // Use saveAnswerWithMedia for premium games with media, otherwise use saveSingleAnswer
      if (game?.is_paid === 'premium' && currentMediaFile) {
        const result = await saveAnswerWithMedia(q.id!, answerStr, currentMediaFile);
        saveError = result.error;
      } else {
        const result = await saveSingleAnswer(q.id!, answerStr);
        saveError = result.error;
      }
      
      if (saveError) {
        setError(saveError.message || 'Failed to save answer. Please try again.');
        setSaving(false);
        return;
      }
      
      if (current < questions.length - 1) setCurrent((c) => c + 1);
      else setShowConfirm(true);
    } catch (err: any) {
      showToast(err.message || 'Unexpected error saving answer. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (current > 0) setCurrent((c) => c - 1);
    else navigation.goBack();
  }

  // Validation summary result type
  interface ValidationSummary {
    success: boolean;
    errors: string[];
  }

  const validateAnswers = useCallback((): ValidationSummary => {
    const missingAnswers: string[] = [];
    
    questions.forEach((q: GameQuestion) => {
      const answer: AnswerValue = answers[q.id!];
      const mediaFile: MediaFile | null = mediaFiles[q.id!];
      
      const validation: ValidationResult = validateQuestion(q, answer, mediaFile);
      
      if (!validation.isValid) {
        const questionNumber: number = questions.findIndex((question: GameQuestion) => question.id === q.id) + 1;
        const errorMessage: string = validation.errorMessage || 'Answer required';
        missingAnswers.push(`Question ${questionNumber}: ${errorMessage}`);
      }
    });
    
    return {
      success: missingAnswers.length === 0,
      errors: missingAnswers
    };
  }, [answers, questions, mediaFiles, validateQuestion]);

  async function handleSubmit(): Promise<void> {
    
    const validation: ValidationSummary = validateAnswers();
    if (!validation.success) {
      console.error('validation failed', validation.errors);
      setError(validation.errors.join(', '));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Convert answers to Record<string, string> for API
      const apiAnswers: Record<string, string> = {};
      questions.forEach((q: GameQuestion) => {
        const answer: AnswerValue = answers[q.id!];
        const mediaFile: MediaFile | null = mediaFiles[q.id!];
        
        // For premium games with media, use empty string as answer (media will be handled separately)
        if (game?.is_paid === 'premium' && mediaFile) {
          apiAnswers[q.id!] = '';
        } else if (q.question_type === 'multiple_choice' && q.allow_multiple_selection) {
          const arrayAnswer: string[] = answer as string[];
          apiAnswers[q.id!] = Array.isArray(arrayAnswer) ? arrayAnswer.join(',') : '';
        } else if (typeof answer === 'boolean') {
          const booleanAnswer: boolean = answer as boolean;
          apiAnswers[q.id!] = booleanAnswer ? 'true' : 'false';
        } else {
          const textAnswer: string = answer as string;
          apiAnswers[q.id!] = textAnswer;
        }
      });
      const { error } = await submitAnswers(gameId, apiAnswers, false);
      if (error) throw error;
      navigation.replace('GameDetails', { gameId });
    } catch (err: any) {
      console.error('error submitting answers');
      setError(err.message || 'Failed to submit answers');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
        <ActivityIndicator size="large" color="white" style={{ marginTop: 100 }} />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchQuestions}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (showConfirm) {
    return (
      <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.confirmContainer}>
            <Text style={styles.confirmTitle}>Submit Answers?</Text>
            <Text style={styles.confirmText}>Are you sure you want to complete the game and submit your answers?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirm(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Yes, Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const q = questions[current];

  const answer = answers[q.id!] ?? (q.question_type === 'multiple_choice' && q.allow_multiple_selection ? [] : '');
  const mediaFile = mediaFiles[q.id!] || null;

  return (
    <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.progressText}>
              {current + 1} / {questions.length}
              {(() => {
                const answeredCount: number = questions.filter((q: GameQuestion): boolean => {
                  const answer: AnswerValue = answers[q.id!];
                  const mediaFile: MediaFile | null = mediaFiles[q.id!];
                  
                  // For premium games, media is sufficient
                  if (game?.is_paid === 'premium' && mediaFile) {
                    return true;
                  }
                  
                  // For all other cases, validate based on question type
                  if (q.question_type === 'text') {
                    const textAnswer: string = answer as string;
                    return Boolean(textAnswer && textAnswer.trim() !== '');
                  } else if (q.question_type === 'true_false') {
                    const booleanAnswer: boolean = answer as boolean;
                    return typeof booleanAnswer === 'boolean';
                  } else if (q.question_type === 'multiple_choice') {
                    if (q.allow_multiple_selection) {
                      const arrayAnswer: string[] = answer as string[];
                      return Boolean(Array.isArray(arrayAnswer) && arrayAnswer.length > 0);
                    } else {
                      const singleAnswer: string = answer as string;
                      return Boolean(singleAnswer && singleAnswer.trim() !== '');
                    }
                  }
                  return false;
                }).length;
                return ` (${answeredCount} answered)`;
              })()}
            </Text>
            <Text style={styles.questionText}>{q.question_text}</Text>
            {q.question_type === 'text' && (
              <>
                <TextInput
                  style={styles.textInput}
                  value={typeof answer === 'string' ? answer : ''}
                  onChangeText={handleAnswerChange}
                  placeholder="Type your answer..."
                  placeholderTextColor="#999"
                  multiline
                  accessibilityLabel="Text answer input"
                />
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  selectedMedia={mediaFile}
                  isPremium={game?.is_paid === 'premium'}                  
                />
              </>
            )}
            {q.question_type === 'true_false' && (
              <>
                <View style={styles.booleanContainer}>
                  <TouchableOpacity
                    style={[styles.booleanButton, answer === true && styles.booleanButtonActive]}
                    onPress={() => handleAnswerChange(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Answer True"
                  >
                    <Text style={[styles.booleanButtonText, answer === true && styles.booleanButtonTextActive]}>True</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.booleanButton, answer === false && styles.booleanButtonActive]}
                    onPress={() => handleAnswerChange(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Answer False"
                  >
                    <Text style={[styles.booleanButtonText, answer === false && styles.booleanButtonTextActive]}>False</Text>
                  </TouchableOpacity>
                </View>
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  selectedMedia={mediaFile}
                  isPremium={game?.is_paid === 'premium'}
                />
              </>
            )}
            {q.question_type === 'multiple_choice' && q.multiple_choice_options && (
              <>
                <View style={styles.choicesContainer}>
                  {q.multiple_choice_options.map((option, idx) => {
                    if (q.allow_multiple_selection) {
                      const selected = Array.isArray(answer) && answer.includes(option);
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.choiceButton, selected && styles.choiceButtonActive]}
                          onPress={() => {
                            if (!Array.isArray(answer)) return handleAnswerChange([option]);
                            if (selected) handleAnswerChange(answer.filter((a: string) => a !== option));
                            else handleAnswerChange([...answer, option]);
                          }}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={option}
                        >
                          <Text style={[styles.choiceButtonText, selected && styles.choiceButtonTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      );
                    }
                    const selected = answer === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.choiceButton, selected && styles.choiceButtonActive]}
                        onPress={() => handleAnswerChange(option)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={option}
                      >
                        <Text style={[styles.choiceButtonText, selected && styles.choiceButtonTextActive]}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <MediaUpload
                  onMediaSelect={handleMediaSelect}
                  selectedMedia={mediaFile}
                  isPremium={game?.is_paid === 'premium'}
                />
              </>
            )}
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleBack}
              >
                <Text style={styles.navButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleNext}
                disabled={saving}
              >
                <Text style={styles.navButtonText}>
                  {current === questions.length - 1 ? 'Finish' : 'Next'}
                </Text>
              </TouchableOpacity>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 16,
  },
  questionText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
    minHeight: 80,
    marginBottom: 24,
    color: '#333',
  },
  booleanContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  booleanButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginHorizontal: 8,
  },
  booleanButtonActive: {
    backgroundColor: '#FF7F50',
  },
  booleanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  booleanButtonTextActive: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  choicesContainer: {
    marginBottom: 24,
  },
  choiceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  choiceButtonActive: {
    backgroundColor: '#FF7F50',
  },
  choiceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  choiceButtonTextActive: {
    color: 'white',
    textDecorationLine: 'underline',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  navButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  retryButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  confirmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  confirmTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GameQuestionScreen;
export { GameQuestionScreen }; 