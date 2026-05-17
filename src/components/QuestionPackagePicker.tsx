import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Purple } from '../utils/Colors';
import { QUESTION_PACKAGES, QuestionPackage } from '../data/questionPackages';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectPackage: (pkg: QuestionPackage) => void;
}

export const QuestionPackagePicker: React.FC<Props> = ({ visible, onClose, onSelectPackage }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Question Packages</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button" accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={24} color={Purple} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Choose a package to pre-fill your questions. You can edit or add more afterwards.
        </Text>
        <FlatList
          data={QUESTION_PACKAGES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.name} package, ${item.questions.length} questions`}
              onPress={() => {
                onSelectPackage(item);
                onClose();
              }}
            >
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
              <View style={styles.cardText}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDescription}>{item.description}</Text>
                <Text style={styles.cardCount}>{item.questions.length} questions</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Purple} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: Purple },
  closeButton: { padding: 4 },
  subtitle: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F5FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8D5FF',
  },
  cardEmoji: { fontSize: 32, marginRight: 14 },
  cardText: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  cardDescription: { fontSize: 13, color: '#555', marginBottom: 4 },
  cardCount: { fontSize: 12, color: Purple, fontWeight: '600' },
});
