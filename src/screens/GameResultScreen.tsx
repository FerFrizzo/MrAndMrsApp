import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { getGameResults, completeGame } from '../services/gameService';
import { Purple, PurpleLight, Orange } from '../utils/Colors';
import { Feather } from '@expo/vector-icons';
import { GameQuestionWithAnswer } from '../types/GameData';
import { useToast } from '../contexts/ToastContext';

interface GameResultScreenProps extends NativeStackScreenProps<RootStackParamList, 'GameResult'> { }

export default function GameResultScreen({ route, navigation }: GameResultScreenProps) {
  const { gameId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchResults();
  }, [gameId]);

  async function fetchResults() {
    setLoading(true);
    setError(null);
    try {
      const { questionsWithAnswers, error } = await getGameResults(gameId);
      if (error || !questionsWithAnswers) throw error || new Error('No results found');

      const correct = (questionsWithAnswers as GameQuestionWithAnswer[]).filter(q => q.answer && q.answer.isCorrect === true).length;
      setCorrectCount(correct);
      setTotalCount(questionsWithAnswers.length);
    } catch (e: any) {
      setError(e.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    // Placeholder: implement Instagram sharing with expo-sharing or expo-intent-launcher
    try {
      await Share.share({
        message: `I got ${correctCount} out of ${totalCount} correct in the game! 🎉`,
      });
    } catch (e) {
      // Optionally handle error
    }
  }

  async function handleCompleteGame() {
    setCompleting(true);
    setCompleteError(null);
    try {
      const { error } = await completeGame(gameId);
      if (error) throw error;
      setCompleted(true);
      showToast('Thanks for playing Mr & Mrs game', 'success');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    } catch (e: any) {
      setCompleteError(e.message || 'Failed to complete game');
    } finally {
      setCompleting(false);
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

  return (
    <LinearGradient colors={[Purple, PurpleLight]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Your Result</Text>
          <View style={styles.resultCard}>
            <Text style={styles.resultText}>{correctCount} / {totalCount}</Text>
            <Text style={styles.resultLabel}>Correct Answers</Text>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share to Instagram">
            <Feather name="share-2" size={24} color="white" />
            <Text style={styles.shareButtonText}>Share to Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.completeButton, completed && styles.completeButtonDisabled]}
            onPress={handleCompleteGame}
            accessibilityRole="button"
            accessibilityLabel="Complete Game"
            disabled={completing || completed}
          >
            {completing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.completeButtonText}>{completed ? 'Game Completed' : 'Complete Game'}</Text>
            )}
          </TouchableOpacity>
          {completeError && <Text style={styles.errorText}>{completeError}</Text>}
        </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 32,
    paddingVertical: 48,
    paddingHorizontal: 64,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  resultText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 20,
    color: 'white',
    opacity: 0.8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#833AB4', // Instagram purple
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7F50', // Use the shared orange color
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 24,
  },
  completeButtonDisabled: {
    backgroundColor: '#FFD6B0', // lighter orange for disabled
  },
  completeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
    textAlign: 'center',
  },
}); 