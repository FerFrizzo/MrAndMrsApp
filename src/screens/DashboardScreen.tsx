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
import { GameCard } from '../components/GameCard';
import { GamesSection } from '../components/GamesSection';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [createdGames, setCreatedGames] = useState<GameItem[]>([]);
  const [partnerInterviewedGames, setPartnerInterviewedGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const { createdGames: userCreatedGames, partnerInterviewedGames: userPartnerInterviewedGames, error } = await getUserGames();

      if (error) {
        console.error('Failed to fetch games:', error);
      } else {
        setCreatedGames(userCreatedGames);
        setPartnerInterviewedGames(userPartnerInterviewedGames);
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



          {/* My Games Section */}
          <GamesSection
            title="My Games"
            games={createdGames}
            emptyMessage="You haven't created any games yet."
            loading={loading}
            refreshing={refreshing}
          />

          {/* Games I'm Interviewed In Section */}
          {partnerInterviewedGames.length > 0 && (
            <GamesSection
              title="Games I'm Interviewed In"
              games={partnerInterviewedGames}
              emptyMessage="No games to answer yet."
              loading={loading}
              refreshing={refreshing}
            />
          )}

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={signOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  signOutText: {
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