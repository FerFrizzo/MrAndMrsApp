import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { getProductPrices, purchaseGame } from '../services/paymentService';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const HOW_TO_PLAY_STEPS = [
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

interface HowToPlayModalProps {
  visible: boolean;
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

interface PricingModalProps {
  visible: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ visible, onClose }) => {
  const [prices, setPrices] = useState<{ basic: string; premium: string } | null>(null);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<'basic' | 'premium' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    setPricesLoading(true);
    setError(null);
    try {
      const p = await getProductPrices();
      setPrices(p);
    } catch (e) {
      setError('Could not load prices. Check your connection and try again.');
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchPrices();
    }
  }, [visible]);

  const handleBuy = async (tier: 'basic' | 'premium') => {
    setPurchasing(tier);
    try {
      await purchaseGame(tier);
    } catch (e: any) {
      // User cancelled or sandbox error — silently ignore cancellations
      if (!e?.message?.includes('cancelled') && !e?.message?.includes('cancel')) {
        setError(e?.message || 'Purchase failed. Please try again.');
      }
    } finally {
      setPurchasing(null);
    }
  };

  const pricesUnavailable = prices && (prices.basic === '—' || prices.premium === '—');

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pricingStyles.overlay}>
        <View style={pricingStyles.sheet}>
          <View style={pricingStyles.header}>
            <Text style={pricingStyles.title}>Pricing</Text>
            <TouchableOpacity onPress={onClose} style={pricingStyles.closeButton}>
              <MaterialCommunityIcons name="close" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          <Text style={pricingStyles.subtitle}>
            Purchase a game package to create and share a Mr &amp; Mrs game.
          </Text>

          {pricesLoading && (
            <View style={pricingStyles.center}>
              <ActivityIndicator color={Purple} size="large" />
              <Text style={pricingStyles.loadingText}>Loading prices…</Text>
            </View>
          )}

          {!pricesLoading && error && (
            <View style={pricingStyles.center}>
              <Text style={pricingStyles.errorText}>{error}</Text>
              <TouchableOpacity style={pricingStyles.retryButton} onPress={fetchPrices}>
                <Text style={pricingStyles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!pricesLoading && !error && prices && (
            <>
              {pricesUnavailable && (
                <View style={pricingStyles.sandboxNote}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#8A4FFF" />
                  <Text style={pricingStyles.sandboxText}>
                    Prices unavailable in sandbox — tap Buy to trigger the StoreKit sheet.
                  </Text>
                </View>
              )}

              <View style={pricingStyles.tier}>
                <View style={pricingStyles.tierInfo}>
                  <Text style={pricingStyles.tierName}>Basic Game</Text>
                  <Text style={pricingStyles.tierDesc}>Text-based answers for your partner</Text>
                  <Text style={pricingStyles.tierPrice}>{prices.basic !== '—' ? prices.basic : 'See price at checkout'}</Text>
                </View>
                <TouchableOpacity
                  style={[pricingStyles.buyButton, purchasing === 'basic' && pricingStyles.buyButtonDisabled]}
                  onPress={() => handleBuy('basic')}
                  disabled={purchasing !== null}
                >
                  {purchasing === 'basic'
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={pricingStyles.buyText}>Buy</Text>
                  }
                </TouchableOpacity>
              </View>

              <View style={pricingStyles.divider} />

              <View style={pricingStyles.tier}>
                <View style={pricingStyles.tierInfo}>
                  <Text style={pricingStyles.tierName}>Premium Game</Text>
                  <Text style={pricingStyles.tierDesc}>Answers with photos &amp; videos</Text>
                  <Text style={pricingStyles.tierPrice}>{prices.premium !== '—' ? prices.premium : 'See price at checkout'}</Text>
                </View>
                <TouchableOpacity
                  style={[pricingStyles.buyButton, pricingStyles.buyButtonPremium, purchasing === 'premium' && pricingStyles.buyButtonDisabled]}
                  onPress={() => handleBuy('premium')}
                  disabled={purchasing !== null}
                >
                  {purchasing === 'premium'
                    ? <ActivityIndicator color="white" size="small" />
                    : <Text style={pricingStyles.buyText}>Buy</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={pricingStyles.legalNote}>
            Payment will be charged to your Apple ID account at confirmation.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ visible, currentStep, onNext, onBack, onClose }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          {HOW_TO_PLAY_STEPS[currentStep - 1].title}
        </Text>
        <Text style={styles.modalDescription}>
          {HOW_TO_PLAY_STEPS[currentStep - 1].description}
        </Text>
        <View style={styles.modalButtons}>
          {currentStep > 1 && (
            <Button
              mode="contained"
              onPress={onBack}
              style={styles.modalButton}
            >
              Back
            </Button>
          )}
          <Button
            mode="contained"
            onPress={onNext}
            style={styles.modalButton}
          >
            {currentStep === HOW_TO_PLAY_STEPS.length ? "Close" : "Next"}
          </Button>
        </View>
      </View>
    </View>
  </Modal>
);

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [createdGames, setCreatedGames] = useState<GameItem[]>([]);
  const [partnerInterviewedGames, setPartnerInterviewedGames] = useState<GameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [howToPlayVisible, setHowToPlayVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [pricingVisible, setPricingVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleAccountPress = () => {
    closeMenu();
    navigation.navigate('Account');
  };

  const handlePricingPress = () => {
    closeMenu();
    setPricingVisible(true);
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

  const handleHowToPlayNext = () => {
    if (currentStep < HOW_TO_PLAY_STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setHowToPlayVisible(false);
      setCurrentStep(1);
    }
  };

  const handleHowToPlayBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleHowToPlayClose = () => {
    setHowToPlayVisible(false);
    setCurrentStep(1);
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
                onPress={handlePricingPress}
                title="Pricing"
                leadingIcon="tag-outline"
              />
              <Menu.Item
                onPress={handleSignOut}
                title="Sign Out"
                leadingIcon="logout"
              />
            </Menu>
          </View>

          <HowToPlayModal
            visible={howToPlayVisible}
            currentStep={currentStep}
            onNext={handleHowToPlayNext}
            onBack={handleHowToPlayBack}
            onClose={handleHowToPlayClose}
          />

          <PricingModal
            visible={pricingVisible}
            onClose={() => setPricingVisible(false)}
          />

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
    marginTop: 28,
    marginBottom: 24,
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

const pricingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    lineHeight: 20,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#555',
    fontSize: 14,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: Purple,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  sandboxNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0ebff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  sandboxText: {
    flex: 1,
    fontSize: 12,
    color: '#6b21a8',
    lineHeight: 18,
  },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  tierInfo: {
    flex: 1,
    paddingRight: 12,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  tierDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  tierPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Purple,
  },
  buyButton: {
    backgroundColor: Purple,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  buyButtonPremium: {
    backgroundColor: '#FF7F50',
  },
  buyButtonDisabled: {
    opacity: 0.6,
  },
  buyText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
  },
  legalNote: {
    marginTop: 20,
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
});

export default DashboardScreen; 