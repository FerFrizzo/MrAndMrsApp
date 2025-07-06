import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Share,
  Modal,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/RootStackParamList';
import { LinearGradient } from 'expo-linear-gradient';
import { Purple, PurpleLight, getStatusColor } from '../utils/Colors';
import { getGameWithQuestions, sendGameInvite, updateQuestion, deleteQuestion, createQuestion, updateGameName, updateGameData, updateGameStatusAndIsPaid } from '../services/gameService';
import { GameData, GameQuestion, GAME_STATUS_MAP, getStatusLabel } from '../types/GameData';
import { AntDesign, MaterialCommunityIcons, Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import MultipleChoiceEditor from '../components/MultipleChoiceEditor';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../config/supabaseClient';
import { openPaymentSheet } from '../services/paymentService';

type GameDetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'GameDetails' | 'GameQuestion'>;

const GameDetailsScreen: React.FC<GameDetailsScreenProps> = ({ route, navigation }) => {
  const { gameId } = route.params;
  const [game, setGame] = useState<GameData | null>(null);
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<GameQuestion | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'text' | 'multiple_choice' | 'true_false'>('text');
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [allowsMultipleSelection, setAllowsMultipleSelection] = useState(false);
  const { showToast, showDialog } = useToast();
  const [status, setStatus] = useState<keyof typeof GAME_STATUS_MAP>('in_creation');
  const [targetStarted, setTargetStarted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  useEffect(() => {
    fetchGameDetails();
  }, [gameId]);

  useEffect(() => {
    if (game) {
      setStatus(game.status || 'in_creation');
      // If the game is completed, the target has started/finished
      //todo: check if this is accurate
      setTargetStarted(game.status === 'playing');
    }
  }, [game]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data?.user?.id ?? null);
      setCurrentUserEmail(data?.user?.email ?? null);
    });
  }, []);

  const fetchGameDetails = async () => {
    setLoading(true);
    try {
      const { game, error } = await getGameWithQuestions(gameId);
      if (error) throw error;

      setGame(game);
      setQuestions(game?.questions || []);
    } catch (error: any) {
      showToast(error.message || 'Failed to load game details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (question: GameQuestion, index: number) => {
    setEditingQuestion({ ...question }); // Make a proper copy to preserve the ID
    setQuestionText(question.question_text);
    setQuestionType(question.question_type);
    setIsNewQuestion(false);
    setEditIndex(index);
    setMultipleChoiceOptions(question.multiple_choice_options || []);
    setAllowsMultipleSelection(question.allow_multiple_selection || false);
    setModalVisible(true);
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionType('text');
    setIsNewQuestion(true);
    setEditIndex(-1);
    setMultipleChoiceOptions([]);
    setAllowsMultipleSelection(false);
    setModalVisible(true);
  };

  const handleDeleteQuestion = async (index: number) => {
    const questionToDelete = questions[index];

    if (!questionToDelete || !questionToDelete.id) {
      showToast('Cannot delete question - missing ID', 'error');
      return;
    }

    showDialog(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const { success, error } = await deleteQuestion(questionToDelete.id as string);

              if (error) {
                throw error;
              }

              if (success) {
                // Update local state after successful deletion
                const updatedQuestions = [...questions];
                updatedQuestions.splice(index, 1);
                setQuestions(updatedQuestions);

                if (game) {
                  setGame({
                    ...game,
                    questions: updatedQuestions
                  });
                }

                showToast('Question deleted successfully', 'success');
              }
            } catch (error: any) {
              console.error('Error deleting question:', error);
              showToast(error.message || 'Failed to delete question', 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ],
      'confirm'
    );
  };

  const handleSaveQuestion = async () => {
    if (!questionText.trim()) {
      showToast('Please enter a question', 'error');
      return;
    }

    if (questionType === 'multiple_choice' && (!multipleChoiceOptions || multipleChoiceOptions.length < 2)) {
      showToast('Multiple choice questions must have at least 2 options', 'error');
      return;
    }

    setSaving(true);
    try {
      if (isNewQuestion) {
        // Create new question
        const newQuestion: GameQuestion = {
          question_text: questionText.trim(),
          question_type: questionType,
          game_id: gameId,
          order_num: questions.length + 1,
          multiple_choice_options: questionType === 'multiple_choice' ? multipleChoiceOptions : [],
          allow_multiple_selection: questionType === 'multiple_choice' ? allowsMultipleSelection : false
        };

        const { success, newQuestion: createdQuestion, error } = await createQuestion(newQuestion);

        if (error) {
          console.error('Error creating question:', error);
          showToast(error.message || 'Failed to create question', 'error');
          return;
        }

        if (success && createdQuestion) {
          // Update the local state with the newly created question
          const updatedQuestions = [...questions, createdQuestion];
          setQuestions(updatedQuestions);

          if (game) {
            setGame({
              ...game,
              questions: updatedQuestions
            });
          }

          setModalVisible(false);
          showToast('Question created successfully', 'success');
        }
      } else {
        // Update existing question
        const updatedQuestion: GameQuestion = {
          ...editingQuestion,
          question_text: questionText.trim(),
          question_type: questionType,
          multiple_choice_options: questionType === 'multiple_choice' ? multipleChoiceOptions : [],
          allow_multiple_selection: questionType === 'multiple_choice' ? allowsMultipleSelection : false
        };

        if (updatedQuestion.id) {
          const { success, error } = await updateQuestion(updatedQuestion);

          if (error) {
            console.error('Error updating question:', error);
            showToast(error.message || 'Failed to update question', 'error');
            return;
          }

          if (success) {
            // Update the local state
            const updatedQuestions = [...questions];
            updatedQuestions[editIndex] = updatedQuestion;
            setQuestions(updatedQuestions);

            if (game) {
              setGame({
                ...game,
                questions: updatedQuestions
              });
            }

            setModalVisible(false);
            showToast('Question updated successfully', 'success');
          }
        } else {
          showToast('Cannot update question - missing ID', 'error');
        }
      }
    } catch (error: any) {
      console.error('Error saving question:', error);
      showToast(error?.message || 'An unexpected error occurred while saving the question', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async () => {
    if (!game) {
      showToast('Game not found', 'error');
      return;
    }

    if (game.status !== 'ready_to_play') {
      showDialog(
        'Game Payment',
        'Choose your game plan to proceed:',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => { } },
          {
            text: 'Pay & Create Basic',
            style: 'default',
            onPress: async () => {
              try {
                await openPaymentSheet(199);

                // Update game with paid status after successful payment
                const { error } = await updateGameStatusAndIsPaid("ready_to_play", 'basic', game.id);

                if (error) throw error;

                showToast('Payment successful! Basic game is ready to play.', 'success');

                // Refresh game data
                await fetchGameDetails();
              } catch (error: any) {
                console.error('Error:', error);
                showToast(error.message || 'Payment failed', 'error');
              }
            }
          },
          {
            text: 'Pay & Create Premium',
            style: 'default',
            onPress: async () => {
              try {
                await openPaymentSheet(299);

                // Update game with paid status after successful payment
                const { error } = await updateGameStatusAndIsPaid("ready_to_play", 'premium', game.id);
                if (error) throw error;

                showToast('Payment successful! Premium game is ready to play.', 'success');

                // Refresh game data
                await fetchGameDetails();
              } catch (error: any) {
                console.error('Error:', error);
                showToast(error.message || 'Payment failed', 'error');
              }
            }
          }
        ],
        'confirm'
      );
      return;
    }

    showDialog(
      'Send Invitation',
      'Do you want to send an invitation to join this game?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => { }
        },
        {
          text: 'Send',
          style: 'default',
          onPress: async () => {
            try {
              setSendingInvite(true);
              const { success, error } = await sendGameInvite(gameId, game.partner_interviewed_email);

              if (error) throw error;

              if (success) {
                try {
                  await Share.share({
                    message: `Join me for a game of "Mr & Mrs"! I've sent an invite to your email. Download the app and find out how well you know your partner!`,
                    title: `${game.game_name} Invitation`,
                  });
                } catch (shareError) {
                  console.error('Share error:', shareError);
                }

                showToast(`An invitation has been sent to ${game.partner_interviewed_email} with a special link to access this game.`, 'success');
              }
            } catch (error: any) {
              showToast(error.message || 'Failed to send invitation', 'error');
            } finally {
              setSendingInvite(false);
            }
          }
        }
      ],
      'confirm'
    );
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

  const renderQuestionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isNewQuestion ? 'Add Question' : 'Edit Question'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <Text style={styles.inputLabel}>Question Text</Text>
              <TextInput
                style={styles.questionInput}
                value={questionText}
                onChangeText={setQuestionText}
                placeholder="Enter your question here"
                placeholderTextColor="#999"
                multiline
              />

              <Text style={styles.inputLabel}>Question Type</Text>
              <View style={styles.typeButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    questionType === 'text' && styles.typeButtonActive
                  ]}
                  onPress={() => setQuestionType('text')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    questionType === 'text' && styles.typeButtonTextActive
                  ]}>
                    Text Response
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    questionType === 'multiple_choice' && styles.typeButtonActive
                  ]}
                  onPress={() => setQuestionType('multiple_choice')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    questionType === 'multiple_choice' && styles.typeButtonTextActive
                  ]}>
                    Multiple Choice
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    questionType === 'true_false' && styles.typeButtonActive
                  ]}
                  onPress={() => setQuestionType('true_false')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    questionType === 'true_false' && styles.typeButtonTextActive
                  ]}>
                    True/False
                  </Text>
                </TouchableOpacity>
              </View>

              {questionType === 'multiple_choice' && (
                <View style={styles.multipleChoiceContainer}>
                  <Text style={styles.inputLabel}>Multiple Choice Options</Text>


                  <View style={styles.editorContainer}>
                    <MultipleChoiceEditor
                      options={multipleChoiceOptions}
                      allowsMultipleSelection={allowsMultipleSelection}
                      onOptionsChange={setMultipleChoiceOptions}
                      onAllowsMultipleSelectionChange={setAllowsMultipleSelection}
                    />
                  </View>
                  {/* <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setAllowsMultipleSelection(!allowsMultipleSelection)}
                  >
                    <View style={[
                      styles.checkbox,
                      allowsMultipleSelection && styles.checkboxChecked
                    ]}>
                      {allowsMultipleSelection && (
                        <MaterialIcons name="check" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.checkboxLabel}>Allow multiple answers</Text>
                  </TouchableOpacity> */}
                </View>

              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveQuestion}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

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
            onPress={() => navigation.navigate('Dashboard')}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Game Details</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSendInvite}
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
                  <Text style={styles.statusText}>{getStatusLabel(game.status)}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Partner Interviewed:</Text>
                  <View style={styles.targetInfo}>
                    <Text style={styles.infoValue}>{game.partner_interviewed_name}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Created:</Text>
                  <Text style={styles.infoValue}>{formatDate(game.created_at || '')}</Text>
                </View>


                {game.is_paid && (
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name={game.is_paid === 'premium' ? "crown" : "crown-outline"} size={20} color={game.is_paid === 'premium' ? "#FFCC00" : Purple} />
                    <Text style={styles.infoLabel}>Type:</Text>
                    <Text style={styles.infoValue}>{game.is_paid === 'premium' ? 'Premium' : game.is_paid === 'basic' ? 'Basic' : 'Not Paid Yet'}</Text>
                  </View>
                )}

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={Purple} />
                  <Text style={styles.infoLabel}>Partner Playing:</Text>
                  <View style={styles.targetInfo}>
                    <Text style={styles.infoValue}>{game.partner_playing_name}</Text>
                  </View>
                </View>

              </View>

              {game.partner_interviewed_email !== currentUserEmail && (
                <View style={styles.questionsSection}>
                  <Text style={styles.sectionTitle}>Questions ({questions.length})</Text>
                  {questions.map((question, index) => (
                    <View key={index} style={styles.questionCard}>
                      <View style={styles.questionActions}>
                        <Text style={styles.questionNumber}>Question {index + 1}</Text>
                        <View style={styles.actionButtons}>
                          {!["answered", "results_revealed", "completed"].includes((game.status as string)) && (
                            <>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditQuestion(question, index)}
                              >
                                <Feather name="edit" size={16} color={Purple} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteQuestion(index)}
                              >
                                <Feather name="trash-2" size={16} color="#FF3B30" />
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                      <Text style={styles.questionText}>{question.question_text}</Text>
                      <View style={styles.questionFooter}>
                        <Text style={styles.questionType}>Type: {
                          question.question_type === 'multiple_choice' ? 'Multiple Choice' :
                            question.question_type === 'text' ? 'Text Response' :
                              question.question_type === 'true_false' ? 'True/False' :
                                question.question_type
                        }</Text>
                        {question.question_type === 'multiple_choice' &&
                          question.allow_multiple_selection && (
                            <Text style={styles.multipleAnswersLabel}>Multiple answers allowed</Text>
                          )}
                      </View>

                      {question.question_type === 'multiple_choice' && question.multiple_choice_options && question.multiple_choice_options.length > 0 && (
                        <View style={styles.optionsContainer}>
                          {question.multiple_choice_options.map((option, optionIndex) => (
                            <View key={optionIndex} style={styles.optionItem}>
                              <View style={styles.optionBullet} />
                              <Text style={styles.optionText}>{option}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                  {(game.status === 'in_creation') && (
                    <TouchableOpacity
                      style={styles.addQuestionButton}
                      onPress={handleAddQuestion}
                    >
                      <AntDesign name="plus" size={18} color="white" />
                      <Text style={styles.addQuestionButtonText}>Add Question</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <View style={styles.buttonContainer}>
          {game &&
            game.status !== 'completed' &&
            !targetStarted &&
            currentUserId && (
              game.creator_id === currentUserId ? (
                game.status === 'answered' ? (
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => navigation.navigate('ReviewAnswers', { gameId })}
                    accessibilityRole="button"
                    accessibilityLabel="View answers for this game"
                  >
                    <Text style={styles.playButtonText}>View Answers</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={handleSendInvite}
                    disabled={sendingInvite}
                  >
                    {sendingInvite ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="email" size={20} color="white" style={styles.inviteIcon} />
                        <Text style={styles.playButtonText}>Send Invite to {game.partner_interviewed_name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )
              ) : (game.partner_interviewed_email === currentUserEmail && game.status !== 'in_creation') ? (
                <TouchableOpacity
                  style={styles.playButton}
                  onPress={async () => {
                    if (game && game.status !== 'playing') {
                      await updateGameName(game.id!, { status: 'playing' });
                    }
                    navigation.navigate('GameQuestion', { gameId });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Start answering game questions"
                >
                  <Text style={styles.playButtonText}>Play Game</Text>
                </TouchableOpacity>
              ) : null
            )}
        </View>
      </SafeAreaView>

      {renderQuestionModal()}
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
    width: 160,
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  infoValueSecondary: {
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
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionType: {
    fontSize: 12,
    color: '#333',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
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
  multipleAnswersLabel: {
    fontSize: 12,
    color: Purple,
    fontWeight: '500',
    backgroundColor: 'rgba(138, 43, 226, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionsContainer: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Purple,
    marginRight: 8,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    maxHeight: 400,
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  questionInput: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    padding: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonActive: {
    borderColor: Purple,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeButtonTextActive: {
    color: Purple,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 12,
    backgroundColor: Purple,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 100,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addQuestionButton: {
    flexDirection: 'row',
    backgroundColor: Purple,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addQuestionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  multipleChoiceContainer: {
    marginTop: 10,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: Purple,
    backgroundColor: Purple,
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  editorContainer: {
    marginTop: 1,
  },
  targetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default GameDetailsScreen; 