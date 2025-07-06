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
  Modal,
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
import { Menu, Provider, Button } from 'react-native-paper';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [createdGames, setCreatedGames] = useState<GameItem[]>([]);
  const [partnerInterviewedGames, setPartnerInterviewedGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const HowToPlayModal = () => {
    const steps = [
      {
        title: "Bridesmaid/Groomsman",
        description: "1. Create a new game in the app\n2. Send the link to the partner who won't be at the party\n3. Wait for them to answer all questions\n4. Host the reveal party with the other partner!"
      },
      {
        title: "Partner Answering",
        description: "1. Get the link from your partner's friend\n2. Answer all questions honestly\n3. Submit your answers before the party\n4. Keep your answers secret!"
      },
      {
        title: "Partner Playing",
        description: "1. Come to the party\n2. Answer the same questions in front of everyone\n3. Watch as your answers are compared with your partner's\n4. Enjoy the fun and laughter!"
      },
      {
        title: "Pro Tips!",
        description: "• Mix fun and serious questions\n• Take videos of the reactions\n• Add a dare or challenge for each question answered incorrectly"
      }
    ];

    const handleNext = () => {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        setHowToPlayVisible(false);
        setCurrentStep(1);
      }
    };

    const handleBack = () => {
      if (currentStep > 1) {
        setCurrentStep(currentStep - 1);
      }
    };

    return (
      <Modal
        visible={howToPlayVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setHowToPlayVisible(false);
          setCurrentStep(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {steps[currentStep - 1].title}
            </Text>
            <Text style={styles.modalDescription}>
              {steps[currentStep - 1].description}
            </Text>
            <View style={styles.modalButtons}>
              {currentStep > 1 && (
                <Button
                  mode="contained"
                  onPress={handleBack}
                  style={styles.modalButton}
                >
                  Back
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleNext}
                style={styles.modalButton}
              >
                {currentStep === steps.length ? "Close" : "Next"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    );
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
            <TouchableOpacity 
              style={styles.howToPlayButton}
              onPress={() => setHowToPlayVisible(true)}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={24} color="white" />
              <Text style={styles.howToPlayText}>How to Play</Text>
            </TouchableOpacity>
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

          <HowToPlayModal />

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
              emptyMessage="Hit that create game button!"
              loading={loading}
              refreshing={refreshing}
            />

            {/* Games I'm Interviewed In Section */}
            <GamesSection
              title="What I Need to Respond To"
              games={partnerInterviewedGames}
              emptyMessage="Hold on, you haven't been interviewed in any games yet."
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    minWidth: 100,
  },
  howToPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 150,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  howToPlayText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DashboardScreen; 