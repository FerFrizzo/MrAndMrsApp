import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { useAuth } from '../context/AuthContext';
import { Purple, PurpleLight } from '../utils/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserGames } from '../services/gameService';
import { GameItem } from '../types/GameData';
import { signOut } from '../services/authService';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [games, setGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { games: userGames, error } = await getUserGames();

      if (error) {
        console.error('Failed to fetch games:', error);
      } else {
        setGames(userGames);
      }
    } catch (error) {
      console.error('Error in fetchGames:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const handleCreateGame = () => {
    navigation.navigate('CreateGame');
  };

  return (
    <LinearGradient
      colors={[Purple, PurpleLight]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="white"
            />
          }
        >
          {/* Create New Game Button */}
          <TouchableOpacity
            style={styles.createGameButton}
            onPress={handleCreateGame}
          >
            <Text style={styles.createGameText}>Create New Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createGameButton}
            onPress={signOut}
          >
            <Text style={styles.createGameText}>Sign Out</Text>
          </TouchableOpacity>

          {/* My Games Section */}
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>My Games</Text>

            {loading && !refreshing ? (
              <ActivityIndicator color="white" size="large" style={styles.loader} />
            ) : games.length > 0 ? (
              games.map((game) => (
                <TouchableOpacity
                  key={game.id}
                  style={styles.gameCard}
                  onPress={() => navigation.navigate('GameDetails', { gameId: game.id })}
                >
                  <View style={styles.gameCardContent}>
                    <Text style={styles.gameTitle}>{game.title}</Text>
                    <Text style={styles.gameInfo}>
                      {game.createdAt} • {game.questionCount} questions
                      {game.isPremium && " • Premium"}
                    </Text>
                    <Text style={styles.statusText}>
                      Status: <Text style={{ color: game.colorDot }}>{game.status}</Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: game.colorDot }
                    ]}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You haven't created any games yet.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  createGameButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  createGameText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gamesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  gameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameCardContent: {
    flex: 1,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  gameInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  loader: {
    marginTop: 30,
  },
  emptyState: {
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default DashboardScreen; 