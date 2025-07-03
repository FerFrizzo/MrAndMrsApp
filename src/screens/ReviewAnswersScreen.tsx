import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { getGameResults, updateAnswerCorrectness } from '../services/gameService';
import { GameData, GameQuestion, GameAnswer, GameQuestionWithAnswer } from '../types/GameData';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { Purple, PurpleLight } from '../utils/Colors';
import { AnswerCard } from '../components/AnswerCard';

interface ReviewAnswersScreenProps extends NativeStackScreenProps<RootStackParamList, 'ReviewAnswers'> { }

function getAnswerDisplay(question: GameQuestion, answer: string | null): string {
  if (!answer) return 'No answer';
  if (question.question_type === 'true_false') {
    return answer === 'true' ? 'True' : 'False';
  }
  if (question.question_type === 'multiple_choice' && question.allow_multiple_selection) {
    try {
      const arr = JSON.parse(answer);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch { }
  }
  return answer;
}

export default function ReviewAnswersScreen({ route, navigation }: ReviewAnswersScreenProps) {
  const { gameId } = route.params;
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [marking, setMarking] = useState(false);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<GameQuestionWithAnswer[]>();

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  async function fetchGame() {
    setLoading(true);
    setError(null);
    try {
      const { game, questionsWithAnswers, error } = await getGameResults(gameId);
      if (error || !game || !questionsWithAnswers) throw error || new Error('Game not found');
      setGame(game);
      setQuestionsWithAnswers(questionsWithAnswers);
    } catch (e: any) {
      setError(e.message || 'Failed to load game');
    } finally {
      setLoading(false);
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
      </LinearGradient>
    );
  }
  if (!game || !questionsWithAnswers) {
    return (
      <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
        <Text style={styles.errorText}>No questions or answers found.</Text>
      </LinearGradient>
    );
  }

  const question = questionsWithAnswers[currentIndex];
  const answer = question.answer;

  function handleFinish() {
    if (game?.id) {
      navigation.navigate('GameResult', { gameId: game.id });
    } else {
      navigation.goBack();
    }
  }

  async function handleMark(isCorrect: boolean) {
    if (!questionsWithAnswers) return;
    const current = questionsWithAnswers[currentIndex];
    if (current.answer && current.answer.id) {
      setMarking(true);
      try {
        const { error } = await updateAnswerCorrectness(current.answer.id, isCorrect);
        if (error) {
          console.error('Failed to update answer correctness:', error);
          // Optionally show a toast or error message
        }
      } catch (err) {
        console.error('Unexpected error updating answer correctness:', err);
      } finally {
        setMarking(false);
      }
    }
    if (currentIndex < questionsWithAnswers.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      handleFinish();
    }
  }

  return (
    <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Answers</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.progressText}>{currentIndex + 1} / {questionsWithAnswers.length}</Text>
          <Text style={styles.questionText}>{question.question_text}</Text>
          <AnswerCard 
            question={question} 
            answer={answer?.partner_interviewed_answer ?? null} 
            partnerInterviewedName={game.partner_interviewed_name}
            mediaUrl={answer?.media_url}
            mediaType={answer?.media_type}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#F44336' }]}
              onPress={() => handleMark(false)}
              accessibilityRole="button"
              accessibilityLabel="Mark as wrong"
              disabled={marking}
            >
              <MaterialIcons name="cancel" size={24} color="white" />
              <Text style={styles.buttonText}>Wrong</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleMark(true)}
              accessibilityRole="button"
              accessibilityLabel="Mark as correct"
              disabled={marking}
            >
              <Feather name="check-circle" size={24} color="white" />
              <Text style={styles.buttonText}>Correct</Text>
            </TouchableOpacity>
          </View>
          {/* <View style={styles.navButtons}>
            {currentIndex === questionsWithAnswers.length - 1 && (
              <TouchableOpacity
                style={styles.navButton}
                onPress={handleFinish}
                accessibilityRole="button"
                accessibilityLabel="Finish review"
                disabled={marking}
              >
                <Text style={styles.navButtonText}>Finish</Text>
              </TouchableOpacity>
            )}
          </View> */}
        </ScrollView>
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
  answerCardContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'flex-end',
  },
  answerLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bubbleTransparent: {
    maxWidth: '80%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginLeft: 6,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderTopColor: 'transparent',
    borderRightWidth: 16,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderStyle: 'solid',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 18,
    color: Purple,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
}); 