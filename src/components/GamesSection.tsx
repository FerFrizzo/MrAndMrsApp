import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { GameItem } from '../types/GameData';
import { GameCard } from './GameCard';

interface GamesSectionProps {
  title: string;
  games: GameItem[];
  emptyMessage: string;
  loading: boolean;
  refreshing: boolean;
}

function GamesSection({ title, games, emptyMessage, loading, refreshing }: GamesSectionProps) {
  return (
    <View style={styles.gamesSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {loading && !refreshing ? (
        <ActivityIndicator color="white" size="large" style={styles.loader} />
      ) : games.length > 0 ? (
        games.map(game => <GameCard key={game.id} game={game} />)
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gamesSection: {
    marginBottom: 20,
    marginTop: 20,
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
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export { GamesSection };