import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { Purple, PurpleLight } from '../utils/Colors';
import { createGame } from '../services/gameService';
import { GameQuestion } from '../types/GameData';

type CreateGameScreenProps = NativeStackScreenProps<RootStackParamList, 'CreateGame'>;

const CreateGameScreen: React.FC<CreateGameScreenProps> = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Game details
  const [gameName, setGameName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [occasion, setOccasion] = useState('');
  const [theme, setTheme] = useState('');

  // Questions
  const [questions, setQuestions] = useState<GameQuestion[]>([
    { question_text: 'What is your partner\'s favorite food?', question_type: 'text' },
    { question_text: 'What is your partner\'s dream vacation?', question_type: 'text' },
    { question_text: 'What would your partner say is your most annoying habit?', question_type: 'text' }
  ]);

  // Game settings
  const [isPremium, setIsPremium] = useState(false);
  const [timeLimit, setTimeLimit] = useState('');

  const addQuestion = () => {
    setQuestions([...questions, { question_text: '', question_type: 'text' }]);
  };

  const updateQuestion = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = text;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      Alert.alert('Error', 'You must have at least one question');
      return;
    }
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!gameName || !targetEmail) {
        Alert.alert('Error', 'Please fill in game name and target email');
        return false;
      }
    } else if (currentStep === 2) {
      const emptyQuestions = questions.some(q => !q.question_text);
      if (emptyQuestions) {
        Alert.alert('Error', 'Please fill in all questions');
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

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const gameData = {
        game_name: gameName,
        target_email: targetEmail,
        occasion,
        theme,
        questions,
        is_premium: isPremium,
        time_limit: timeLimit ? parseInt(timeLimit) : null
      };

      console.log('gameData', gameData);
      const { game, error } = await createGame(gameData);

      if (error) throw error;

      Alert.alert(
        'Success!',
        'Your game has been created successfully',
        [
          {
            text: 'View Game',
            onPress: () => navigation.replace('GameQuestion', { gameId: game?.id || '' })
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create game');
    } finally {
      setLoading(false);
    }
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

            <Text style={styles.label}>Target Email</Text>
            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="#A0A0A0"
              value={targetEmail}
              onChangeText={setTargetEmail}
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

            <Text style={styles.label}>Theme</Text>
            <TextInput
              style={styles.input}
              placeholder="(optional)"
              placeholderTextColor="#A0A0A0"
              value={theme}
              onChangeText={setTheme}
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

            <View style={styles.optionContainer}>
              <Text style={styles.optionLabel}>Time Limit (minutes)</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="Optional"
                placeholderTextColor="#A0A0A0"
                value={timeLimit}
                onChangeText={setTimeLimit}
                keyboardType="numeric"
              />
            </View>

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
                onPress={handleSubmit}
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {renderStep()}
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
    </TouchableWithoutFeedback>
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
    justifyContent: 'center',
  },
  stepContainer: {
    padding: 10,
    paddingTop: 0,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
  nextButton: {
    backgroundColor: '#FF7F50',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    flex: 1,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: 'white',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 50,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    height: 50,
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 25,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 16,
    color: 'white',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#FF7F50',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
  },
  toggleHandleActive: {
    transform: [{ translateX: 22 }],
  },
  premiumNote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  smallInput: {
    width: 100,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 16,
    marginVertical: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  summaryItem: {
    fontSize: 14,
    color: 'white',
    marginBottom: 8,
  },
});

export default CreateGameScreen; 