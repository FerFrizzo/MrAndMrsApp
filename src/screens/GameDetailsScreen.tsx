import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Share,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { LinearGradient } from 'expo-linear-gradient';
import { Purple, PurpleLight, getStatusColor } from '../utils/Colors';
import { getGameWithQuestions, sendGameInvite } from '../services/gameService';
import { GameData, GameQuestion } from '../types/GameData';
import { AntDesign, MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';

type GameDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'GameDetails' | 'GameQuestion'>;

const GameDetailsScreen: React.FC<GameDetailsScreenProps> = ({ route, navigation }) => {
  const { gameId } = route.params;
  const [game, setGame] = useState<GameData | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  const fetchGameDetails = async () => {
    try {
      setLoading(true);
      const { game: gameData, error } = await getGameWithQuestions(gameId);

      if (error) {
        throw error;
      }

      if (gameData) {
        setGame(gameData);
        setQuestions(gameData.questions || []);
      }
    } catch (error) {
      console.error('Error fetching game details:', error);
      Alert.alert('Error', 'Could not load game details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareGame = async () => {
    if (!game) return;

    try {
      setSendingInvite(true);

      // Send invite via email with magic link
      const { success, error } = await sendGameInvite(gameId, game.target_email);

      if (error) throw error;

      if (success) {
        // Try to use the native share dialog as a fallback
        try {
          const result = await Share.share({
            message: `Join me for a game of "Mr & Mrs"! I've sent an invite to your email. Download the app and find out how well you know your partner!`,
            title: `${game.game_name} Invitation`,
          });
        } catch (shareError) {
          console.log('Share error:', shareError);
        }

        Alert.alert(
          'Invitation Sent!',
          `An invitation has been sent to ${game.target_email} with a special link to access this game.`
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <LinearGradient
        colors={[Purple, PurpleLight]}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading game details...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={[Purple, PurpleLight]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Game Details</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareGame}
            disabled={sendingInvite}
          >
            {sendingInvite ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialIcons name="share" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView}>
          {game && (
            <View style={styles.gameInfoContainer}>
              <View style={styles.titleRow}>
                <Text style={styles.gameTitle}>{game.game_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(game.status) }]}>
                  <Text style={styles.statusText}>{game.status || 'Created'}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Target:</Text>
                  <Text style={styles.infoValue}>{game.target_email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>{formatDate(game.created_at || '')}</Text>
                </View>

                {game.occasion && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="party-popper" size={20} color={Purple} />
                    <Text style={styles.infoLabel}>Occasion:</Text>
                    <Text style={styles.infoValue}>{game.occasion}</Text>
                  </View>
                )}

                {game.theme && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="palette-outline" size={20} color={Purple} />
                    <Text style={styles.infoLabel}>Theme:</Text>
                    <Text style={styles.infoValue}>{game.theme}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name={game.is_premium ? "crown" : "crown-outline"} size={20} color={game.is_premium ? "#FFCC00" : Purple} />
                  <Text style={styles.infoLabel}>Type:</Text>
                  <Text style={styles.infoValue}>{game.is_premium ? 'Premium' : 'Basic'}</Text>
                </View>

                {game.time_limit && (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color={Purple} />
                    <Text style={styles.infoLabel}>Time Limit:</Text>
                    <Text style={styles.infoValue}>{game.time_limit} minutes</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="lock-closed-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Privacy:</Text>
                  <Text style={styles.infoValue}>{game.privacy_setting || 'Private'}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.inviteButton}
                onPress={handleShareGame}
                disabled={sendingInvite}
              >
                {sendingInvite ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name="email" size={20} color="white" style={styles.inviteIcon} />
                    <Text style={styles.inviteButtonText}>Send Invitation to {game.target_email}</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.questionsSection}>
                <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                {questions.map((question, index) => (
                  <View key={index} style={styles.questionCard}>
                    <Text style={styles.questionNumber}>Question {index + 1}</Text>
                    <Text style={styles.questionText}>{question.question_text}</Text>
                    <Text style={styles.questionType}>Type: {question.question_type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => navigation.navigate('GameQuestion', { gameId })}
          >
            <Text style={styles.playButtonText}>Play Game</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: 'white',
    fontSize: 16,
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
  shareButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  gameInfoContainer: {
    paddingBottom: 100,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
    marginRight: 8,
    width: 80,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  inviteIcon: {
    marginRight: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionsSection: {
    marginBottom: 24,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Purple,
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  questionType: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  playButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default GameDetailsScreen; 