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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Menu, Provider } from 'react-native-paper';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [createdGames, setCreatedGames] = useState<GameItem[]>([]);
  const [partnerInterviewedGames, setPartnerInterviewedGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleAccountPress = () => {
    closeMenu();
    navigation.navigate('Account');
  };

  const handleSignOut = () => {
    closeMenu();
    signOut();
  };

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
    <Provider>
      <LinearGradient
        colors={[Purple, PurpleLight]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
                  <MaterialCommunityIcons name="dots-vertical" size={24} color="white" />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={handleAccountPress}
                title="Account"
                leadingIcon="account"
              />
              <Menu.Item
                onPress={handleSignOut}
                title="Sign Out"
                leadingIcon="logout"
              />
            </Menu>
          </View>

          <TouchableOpacity
            style={styles.createGameButton}
            onPress={handleCreateGame}
          >
            <Text style={styles.createGameText}>Create New Game</Text>
          </TouchableOpacity>

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
            {/* My Games Section */}
            <GamesSection
              title="My Games"
              games={createdGames}
              emptyMessage="You haven't created any games yet."
              loading={loading}
              refreshing={refreshing}
            />

            {/* Games I'm Interviewed In Section */}
            <GamesSection
              title="Games I'm Interviewed In"
              games={partnerInterviewedGames}
              emptyMessage="No games to answer yet."
              loading={loading}
              refreshing={refreshing}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </Provider>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },
  createGameButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 16,
    width: '90%',
    alignSelf: 'center',
    padding: 20,
    alignItems: 'center',
    marginVertical: 40,
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