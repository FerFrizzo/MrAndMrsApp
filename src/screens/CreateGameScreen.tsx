import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { Purple, PurpleLight } from '../utils/Colors';
import { sendGameInvite, createOrUpdateGame, createQuestion, deleteQuestion, getGameWithQuestions, updateGameData } from '../services/gameService';
import { GAME_STATUS_MAP, GameQuestion } from '../types/GameData';
import MultipleChoiceEditor from '../components/MultipleChoiceEditor';
import { useToast } from '../contexts/ToastContext';
import { getProductPrices } from '../services/paymentService';
import { PaywallModal } from '../components/PaywallModal';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type CreateGameScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGame'>;

const CreateGameScreen: React.FC<CreateGameScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [gameId, setGameId] = useState<string | undefined>();

  // Game details
  const [gameName, setGameName] = useState('');
  const [partnerInterviewedEmail, setPartnerInterviewedEmail] = useState('');
  const [partnerInterviewedName, setPartnerInterviewedName] = useState('');
  const [partnerPlayingEmail, setPartnerPlayingEmail] = useState('');
  const [partnerPlayingName, setPartnerPlayingName] = useState('');
  const [occasion, setOccasion] = useState('');

  // Questions
  const [questions, setQuestions] = useState<GameQuestion[]>([
    { question_text: 'What is your partner\'s favorite food?', question_type: 'text' },
    {
      question_text: 'What would your partner pick as their favorite hobby?',
      question_type: 'multiple_choice',
      multiple_choice_options: ['Reading', 'Sports', 'Travel'],
      allow_multiple_selection: false
    }
  ]);

  // Game settings
  const [isPremium, setIsPremium] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState('—');
  const [paywallVisible, setPaywallVisible] = useState(false);

  useEffect(() => {
    getProductPrices().then(p => setPremiumPrice(p.premium)).catch(() => {});
  }, []);

  const { showToast, showDialog } = useToast();
  const { t } = useTranslation();

  // Hide tab bar when this screen is active
  useLayoutEffect(() => {
    const parent = navigation.getParent && navigation.getParent();
    if (parent) {
      parent.setOptions({ tabBarStyle: { display: 'none' } });
    }
    return () => {
      if (parent) {
        parent.setOptions({ tabBarStyle: undefined });
      }
    };
  }, [navigation]);

  const addQuestion = () => {
    setQuestions([...questions, {
      question_text: '',
      question_type: 'text',
      multiple_choice_options: [],
      allow_multiple_selection: false
    }]);
  };

  const updateQuestion = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = text;
    setQuestions(newQuestions);
  };

  const updateQuestionType = (index: number, type: 'text' | 'multiple_choice' | 'true_false') => {
    const newQuestions = [...questions];
    newQuestions[index].question_type = type;

    // Initialize options array if switching to multiple choice
    if (type === 'multiple_choice' && (!newQuestions[index].multiple_choice_options || newQuestions[index].multiple_choice_options?.length === 0)) {
      newQuestions[index].multiple_choice_options = ['Option 1', 'Option 2'];
      newQuestions[index].allow_multiple_selection = false;
    }

    setQuestions(newQuestions);
  };

  const updateQuestionOptions = (index: number, options: string[]) => {
    const newQuestions = [...questions];
    newQuestions[index].multiple_choice_options = options;
    setQuestions(newQuestions);
  };

  const updateQuestionAllowsMultiple = (index: number, allowsMultiple: boolean) => {
    const newQuestions = [...questions];
    newQuestions[index].allow_multiple_selection = allowsMultiple;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      showToast(t('createGame.atLeastOneQuestion'), 'error');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!gameName || !partnerInterviewedEmail || !partnerInterviewedName) {
        showToast(t('createGame.fillAllFields'), 'error');
        return false;
      }
      // Email validation: at least 3 letters, contains @ and .
      const emailRegex = /^[^@\s]{3,}[^\s]*@[^\s]+\.[^\s]+$/;
      if (!emailRegex.test(partnerInterviewedEmail)) {
        showToast(t('createGame.invalidEmail'), 'error');
        return false;
      }
      if (partnerPlayingEmail && !emailRegex.test(partnerPlayingEmail)) {
        showToast(t('createGame.invalidPartnerEmail'), 'error');
        return false;
      }
    } else if (currentStep === 2) {
      const emptyQuestions = questions.some(q => !q.question_text);
      if (emptyQuestions) {
        showToast(t('createGame.fillAllQuestions'), 'error');
        return false;
      }

      // Validate that multiple choice questions have options
      const invalidMultipleChoice = questions.some(q =>
        q.question_type === 'multiple_choice' &&
        (!q.multiple_choice_options || q.multiple_choice_options.length < 2)
      );

      if (invalidMultipleChoice) {
        showToast(t('createGame.multipleChoiceMin'), 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(step)) {
      return;
    }

    try {
      setLoading(true);

      if (step === 1) {
        // Create/Update game with initial details
        if (!gameName.trim() || !partnerInterviewedEmail.trim() || !partnerInterviewedName.trim()) {
          showToast(t('createGame.fillAllFields'), 'error');
          return;
        }

        const { game, error } = await createOrUpdateGame({
          game_name: gameName.trim(),
          partner_interviewed_email: partnerInterviewedEmail.trim(),
          partner_interviewed_name: partnerInterviewedName.trim(),
          partner_playing_email: partnerPlayingEmail.trim() || undefined,
          partner_playing_name: partnerPlayingName.trim() || undefined,
          status: "in_creation",
          is_paid: 'no',
        }, gameId);

        if (error) {
          showToast(t('createGame.failedSaveDetails'), 'error');
          return;
        }

        if (game) {
          setGameId(game.id);
        }
      } else if (step === 2) {
        // Validate all questions have text
        const hasEmptyQuestions = questions.some(q => !q.question_text.trim());
        if (hasEmptyQuestions) {
          showToast(t('createGame.fillAllQuestions'), 'error');
          return;
        }
        // Validate multiple choice questions have at least 2 options
        const hasInvalidMultipleChoice = questions.some(
          q => q.question_type === 'multiple_choice' && (!q.multiple_choice_options || q.multiple_choice_options.length < 2)
        );
        if (hasInvalidMultipleChoice) {
          showToast(t('createGame.multipleChoiceMin'), 'error');
          return;
        }
        // Delete old questions and create new ones
        if (gameId) {
          const { game, error: fetchError } = await getGameWithQuestions(gameId);
          if (fetchError) {
            showToast(t('createGame.saveError'), 'error');
            return;
          }
          const oldQuestionIds = (game?.questions || []).map((q: any) => q.id).filter(Boolean);
          for (const id of oldQuestionIds) {
            await deleteQuestion(id);
          }
          for (const [index, q] of questions.entries()) {
            const { success, error } = await createQuestion({
              ...q,
              game_id: gameId,
              order_num: index + 1,
            });
            if (error || !success) {
              showToast(t('createGame.failedSaveQuestion', { text: q.question_text || '' }), 'error');
              return;
            }
          }
        }
      }

      setStep(step + 1);
    } catch (error) {
      console.error('Error saving game:', error);
      showToast(t('createGame.saveError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const finalizeGame = async (tier: 'no' | 'premium') => {
    if (!gameId) {
      showToast(t('createGame.saveError'), 'error');
      return;
    }
    try {
      setLoading(true);
      const { game, error } = await updateGameData({
        game_name: gameName.trim(),
        partner_interviewed_email: partnerInterviewedEmail.trim(),
        partner_interviewed_name: partnerInterviewedName.trim(),
        partner_playing_email: partnerPlayingEmail.trim() || undefined,
        partner_playing_name: partnerPlayingName.trim() || undefined,
        status: 'ready_to_play',
        is_paid: tier,
      }, gameId);

      if (error) throw error;

      if (game?.id) {
        const { success: inviteSuccess, error: inviteError } = await sendGameInvite(game.id, partnerInterviewedEmail);
        if (inviteError) {
          showToast(t('createGame.gameCreatedInviteError', { error: inviteError.message }), 'warning');
        } else if (inviteSuccess) {
          try {
            await Share.share({
              message: t('createGame.shareMessage'),
              title: t('createGame.shareTitle', { name: gameName }),
            });
          } catch {}
          showToast(t('createGame.gameSaved'), 'success');
        }
      }
      navigation.navigate('Dashboard');
    } catch (error: any) {
      showToast(error.message || t('createGame.paymentFailed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = () => {
    if (questions.length === 0) {
      showToast(t('createGame.atLeastOneQuestion'), 'error');
      return;
    }
    if (!gameId) {
      showToast(t('createGame.saveError'), 'error');
      return;
    }
    if (isPremium) {
      setPaywallVisible(true);
    } else {
      finalizeGame('no');
    }
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('createGame.gameDetails')}</Text>

            <Text style={styles.label}>{t('createGame.gameName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('createGame.enterGameName')}
              placeholderTextColor="#999"
              value={gameName}
              onChangeText={setGameName}
            />

            <Text style={styles.label}>{t('createGame.partnerInterviewedName')}</Text>
            <TextInput
              style={styles.input}
              value={partnerInterviewedName}
              onChangeText={setPartnerInterviewedName}
              placeholder={t('createGame.enterPartnerInterviewedName')}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>{t('createGame.partnerInterviewedEmail')}</Text>
            <TextInput
              style={styles.input}
              value={partnerInterviewedEmail}
              onChangeText={setPartnerInterviewedEmail}
              placeholder={t('createGame.enterPartnerInterviewedEmail')}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>{t('createGame.partnerPlayingName')}</Text>
            <TextInput
              style={styles.input}
              value={partnerPlayingName}
              onChangeText={setPartnerPlayingName}
              placeholder={t('createGame.enterPartnerPlayingName')}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>{t('createGame.partnerPlayingEmail')}</Text>
            <TextInput
              style={styles.input}
              value={partnerPlayingEmail}
              onChangeText={setPartnerPlayingEmail}
              placeholder={t('createGame.enterPartnerPlayingEmail')}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('createGame.questions')}</Text>
            <Text style={styles.stepDescription}>
              {t('createGame.addQuestions', { name: partnerInterviewedName })}
            </Text>
            {questions.map((question, index) => (
              <View key={index} style={styles.questionContainer}>
                <TextInput
                  style={styles.questionInput}
                  placeholder={`Question ${index + 1}`}
                  placeholderTextColor="#A0A0A0"
                  value={question.question_text}
                  onChangeText={(text) => updateQuestion(index, text)}
                  multiline
                />

                <View style={styles.questionTypeContainer}>
                  <Text style={styles.questionTypeLabel}>{t('createGame.questionType')}</Text>
                  <View style={styles.typeButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        question.question_type === 'text' && styles.typeButtonActive
                      ]}
                      onPress={() => updateQuestionType(index, 'text')}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        question.question_type === 'text' && styles.typeButtonTextActive
                      ]}>
                        {t('createGame.text')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        question.question_type === 'multiple_choice' && styles.typeButtonActive
                      ]}
                      onPress={() => updateQuestionType(index, 'multiple_choice')}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        question.question_type === 'multiple_choice' && styles.typeButtonTextActive
                      ]}>
                        {t('createGame.multipleChoice')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        question.question_type === 'true_false' && styles.typeButtonActive
                      ]}
                      onPress={() => updateQuestionType(index, 'true_false')}
                    >
                      <Text style={[
                        styles.typeButtonText,
                        question.question_type === 'true_false' && styles.typeButtonTextActive
                      ]}>
                        {t('createGame.trueFalse')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {question.question_type === 'multiple_choice' && (
                  <MultipleChoiceEditor
                    options={question.multiple_choice_options || []}
                    allowsMultipleSelection={question.allow_multiple_selection || false}
                    onOptionsChange={(options) => updateQuestionOptions(index, options)}
                    onAllowsMultipleSelectionChange={(allows) => updateQuestionAllowsMultiple(index, allows)}
                  />
                )}

                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeQuestion(index)}
                  accessibilityLabel="Remove question"
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addQuestion}
            >
              <Text style={styles.addButtonText}>{t('createGame.addQuestion')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('createGame.gameSettings')}</Text>

            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>{t('createGame.premiumGame')}</Text>
              <TouchableOpacity
                style={[
                  styles.toggle,
                  isPremium ? styles.toggleActive : {}
                ]}
                onPress={() => setIsPremium(!isPremium)}
              >
                <View style={[
                  styles.toggleHandle,
                  isPremium ? styles.toggleHandleActive : {}
                ]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.premiumNote}>
              {t('createGame.premiumNote', { price: premiumPrice })}
            </Text>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>{t('createGame.summary')}</Text>
              <Text style={styles.summaryItem}>{`${t('createGame.game')}: ${gameName}`}</Text>
              <Text style={styles.summaryItem}>{`${t('createGame.partnerInterviewed')}: ${partnerInterviewedEmail}`}</Text>
              <Text style={styles.summaryItem}>{`${t('createGame.partnerPlaying')}: ${partnerPlayingEmail}`}</Text>
              <Text style={styles.summaryItem}>{`${t('createGame.questionsCount')}: ${questions.length}`}</Text>
              <Text style={styles.summaryItem}>{`${t('createGame.type')}: ${isPremium ? t('createGame.premium') : t('createGame.standard')}`}</Text>
              {isPremium && (
                <Text style={styles.summaryItem}>{`${t('createGame.price')}: ${premiumPrice}`}</Text>
              )}
            </View>

          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient
      colors={[Purple, PurpleLight]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.contentContainer}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              {renderStep()}
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
        <View style={styles.stickyFooter}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={step === 3 ? handleCreateGame : handleNext}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Purple} />
            ) : (
              <Text style={styles.nextButtonText}>
                {step === 3 ? t('createGame.createGame') : t('createGame.next')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.stepsContainer}>
          {[1, 2, 3].map((item) => (
            <View
              key={item}
              style={[
                styles.stepDot,
                step >= item ? styles.stepDotActive : {}
              ]}
            />
          ))}
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
      <PaywallModal
        visible={paywallVisible}
        onUpgradeSuccess={() => {
          setPaywallVisible(false);
          finalizeGame('premium');
        }}
        onContinueFree={() => {
          setPaywallVisible(false);
          setIsPremium(false);
          finalizeGame('no');
        }}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 4,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  stepDotActive: {
    backgroundColor: 'white',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  stickyFooter: {
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stepContainer: {
    padding: 0,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 0,
    marginBottom: 16,
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  stepDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    alignSelf: 'center',
    textAlign: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  nextButton: {
    width: '100%',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Purple,
    fontWeight: 'bold',
  },
  questionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
  },
  questionInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    paddingRight: 44,
    fontSize: 16,
    width: '100%',
    minHeight: 50,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 20,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionLabel: {
    color: 'white',
    fontSize: 16,
  },
  smallInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: Purple,
  },
  toggleHandle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
  },
  toggleHandleActive: {
    transform: [{ translateX: 20 }],
  },
  premiumNote: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 20,
    marginLeft: 5,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginVertical: 24,
  },
  summaryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryItem: {
    color: 'white',
    fontSize: 14,
    marginVertical: 4,
  },
  inviteButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginVertical: 5,
  },
  inviteButtonText: {
    color: Purple,
    fontWeight: 'bold',
  },
  questionTypeContainer: {
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 0,
  },
  questionTypeLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginBottom: 6,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    minWidth: 72,
  },
  typeButtonActive: {
    backgroundColor: Purple,
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  typeButtonText: {
    color: 'white',
    fontSize: 13,
  },
});

export default CreateGameScreen; 