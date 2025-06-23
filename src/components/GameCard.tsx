import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/RootStackParamList';
import type { GameItem } from '../types/GameData';
import { getStatusLabel } from '../types/GameData';

interface GameCardProps {
  game: GameItem;
}

function GameCard({ game }: GameCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  function handlePress() {
    navigation.navigate('GameDetails', { gameId: game.id });
  }

  return (
    <TouchableOpacity style={styles.gameCard} onPress={handlePress} accessibilityRole="button" accessibilityLabel={`View details for ${game.title}`}>
      <View style={styles.gameCardContent}>
        <Text style={styles.gameTitle}>{game.title}</Text>
        <Text style={styles.gameInfo}>
          {game.createdAt} • {game.questionCount} questions
          {/* {game.isPremium && ' • Premium'} */}
        </Text>
        <Text style={styles.statusText}>
          Status: <Text style={{ color: game.colorDot }}>{getStatusLabel(game.status)}</Text>
        </Text>
      </View>
      <View style={[styles.colorDot, { backgroundColor: game.colorDot }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});

export { GameCard };