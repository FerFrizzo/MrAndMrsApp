import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameQuestion } from '../types/GameData';
import { Purple } from '../utils/Colors';

export interface AnswerCardProps {
  question: GameQuestion;
  answer: string | null;
  partnerInterviewedName: string;
}

function getAnswerDisplay(question: GameQuestion, answer: string | null): string {
  if (!answer) return 'No answer';
  if (question.question_type === 'true_false') {
    return answer === 'true' ? 'True' : 'False';
  }
  if (question.question_type === 'multiple_choice' && question.allow_multiple_selection) {
    try {
      const arr = JSON.parse(answer);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch { }
  }
  return answer;
}

export function AnswerCard({ question, answer, partnerInterviewedName }: AnswerCardProps) {
  return (
    <View style={styles.answerCardContainer}>
      <Text style={styles.answerLabel}>{`${partnerInterviewedName}'s answer`}</Text>
      <View style={styles.bubbleWrapper}>
        <View style={styles.bubbleTail} />
        <View style={styles.bubbleTransparent} accessibilityRole="text">
          <Text style={styles.bubbleText}>{getAnswerDisplay(question, answer)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  answerCardContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  answerLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleTransparent: {
    maxWidth: '80%',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginLeft: 6,
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderTopWidth: 12,
    borderTopColor: 'transparent',
    borderRightWidth: 16,
    borderRightColor: 'transparent',
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderStyle: 'solid',
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '500',
    textAlign: 'left',
  },
}); 