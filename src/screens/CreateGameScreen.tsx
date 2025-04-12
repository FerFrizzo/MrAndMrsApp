import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { Purple, PurpleLight } from '../utils/Colors';
import { createGame, sendGameInvite } from '../services/gameService';
import { GameQuestion } from '../types/GameData';
import MultipleChoiceEditor from '../components/MultipleChoiceEditor';
import { Picker } from '@react-native-picker/picker';
import { useToast } from '../contexts/ToastContext';

type CreateGameScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGame'>;

const CreateGameScreen: React.FC<CreateGameScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Game details
  const [gameName, setGameName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [targetName, setTargetName] = useState('');
  const [occasion, setOccasion] = useState('');

  // Questions
  const [questions, setQuestions] = useState<GameQuestion[]>([
    { question_text: 'What is your partner\'s favorite food?', question_type: 'text' },
    { question_text: 'What is your partner\'s dream vacation?', question_type: 'text' },
    {
      question_text: 'What would your partner pick as their favorite hobby?',
      question_type: 'multiple_choice',
      multiple_choice_options: ['Reading', 'Sports', 'Cooking', 'Travel'],
      allow_multiple_selection: false
    }
  ]);

  // Game settings
  const [isPremium, setIsPremium] = useState(false);

  const { showToast, showDialog } = useToast();

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
      showToast('You must have at least one question', 'error');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!gameName || !targetEmail || !targetName) {
        showToast('Please fill in game name, target name and email', 'error');
        return false;
      }
    } else if (currentStep === 2) {
      const emptyQuestions = questions.some(q => !q.question_text);
      if (emptyQuestions) {
        showToast('Please fill in all questions', 'error');
        return false;
      }

      // Validate that multiple choice questions have options
      const invalidMultipleChoice = questions.some(q =>
        q.question_type === 'multiple_choice' &&
        (!q.multiple_choice_options || q.multiple_choice_options.length < 2)
      );

      if (invalidMultipleChoice) {
        showToast('Multiple choice questions must have at least 2 options', 'error');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreateGame = async () => {
    if (questions.length === 0) {
      showToast('You must have at least one question', 'error');
      return;
    }

    if (!gameName.trim() || !targetEmail.trim() || !targetName.trim()) {
      showToast('Please fill in game name, target name and email', 'error');
      return;
    }

    // Validate all questions have text
    const hasEmptyQuestions = questions.some(q => !q.question_text.trim());
    if (hasEmptyQuestions) {
      showToast('Please fill in all questions', 'error');
      return;
    }

    // Validate multiple choice questions have at least 2 options
    const hasInvalidMultipleChoice = questions.some(
      q => q.question_type === 'multiple_choice' && (!q.multiple_choice_options || q.multiple_choice_options.length < 2)
    );
    if (hasInvalidMultipleChoice) {
      showToast('Multiple choice questions must have at least 2 options', 'error');
      return;
    }

    showDialog(
      'Create Game',
      'Are you ready to create this game and send an invitation?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { }
        },
        {
          text: 'Create',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const gameData = {
                game_name: gameName.trim(),
                target_email: targetEmail.trim(),
                target_name: targetName.trim(),
                occasion,
                questions,
                is_premium: isPremium,
              };

              console.log('gameData', gameData);
              const { game, error } = await createGame(gameData);

              if (error) throw error;

              // Send invitation email
              if (game?.id) {
                const { success: inviteSuccess, error: inviteError } = await sendGameInvite(game.id, targetEmail);

                if (inviteError) {
                  showToast('Game created, but failed to send invitation: ' + inviteError.message, 'warning');
                } else if (inviteSuccess) {
                  try {
                    await Share.share({
                      message: `Join me for a game of "Mr & Mrs"! I've sent an invite to your email. Download the app and find out how well you know your partner!`,
                      title: `${gameName} Invitation`,
                    });
                  } catch (shareError) {
                    console.log('Share error:', shareError);
                  }
                  showToast('Game created and invitation sent successfully!', 'success');
                }
              } else {
                showToast('Game created successfully!', 'success');
              }

              navigation.replace('GameQuestion', { gameId: game?.id || '' });
            } catch (error: any) {
              showToast(error.message || 'Failed to create game', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'confirm'
    );
  };

  // Render different steps
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Game Details</Text>

            <Text style={styles.label}>Game Name</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="#A0A0A0"
              value={gameName}
              onChangeText={setGameName}
            />

            <Text style={styles.label}>Target's Name</Text>
            <TextInput
              style={styles.input}
              value={targetName}
              onChangeText={setTargetName}
              placeholder="Enter target's name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Target's Email</Text>
            <TextInput
              style={styles.input}
              value={targetEmail}
              onChangeText={setTargetEmail}
              placeholder="Enter target's email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Occasion</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Wedding, Anniversary"
              placeholderTextColor="#A0A0A0"
              value={occasion}
              onChangeText={setOccasion}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Questions</Text>
            <Text style={styles.stepDescription}>
              Add questions for the game target to answer
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
                  <Text style={styles.questionTypeLabel}>Question Type:</Text>
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
                        Text
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
                        Multiple Choice
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
                        True/False
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
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addQuestion}
            >
              <Text style={styles.addButtonText}>+ Add Question</Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Game Settings</Text>

            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Premium Game</Text>
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
              Premium games cost $4.99 and include additional features
            </Text>

            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Summary</Text>
              <Text style={styles.summaryItem}>Game: {gameName}</Text>
              <Text style={styles.summaryItem}>For: {targetEmail}</Text>
              <Text style={styles.summaryItem}>Questions: {questions.length}</Text>
              <Text style={styles.summaryItem}>Type: {isPremium ? 'Premium' : 'Basic'}</Text>
              <Text style={styles.summaryItem}>
                Price: {isPremium ? '$4.99' : '$2.99'}
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                disabled={loading}
              >
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleCreateGame}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>Create Game</Text>
                )}
              </TouchableOpacity>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
      >
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
    padding: 20,
    justifyContent: 'space-between',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: 20,
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
    paddingBottom: 20,
  },
  stepContainer: {
    padding: 10,
    paddingTop: 0,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    flexGrow: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
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
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    width: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
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
    padding: 15,
    marginBottom: 16,
    position: 'relative',
  },
  questionInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    width: '100%',
    minHeight: 50,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: 24,
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
    padding: 12,
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
    marginTop: 8,
    marginBottom: 12,
  },
  questionTypeLabel: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  typeButton: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  typeButtonActive: {
    backgroundColor: Purple,
  },
  typeButtonText: {
    color: 'white',
    fontSize: 12,
  },
  typeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CreateGameScreen; 