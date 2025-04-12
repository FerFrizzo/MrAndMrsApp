import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { Purple } from '../utils/Colors';

interface MultipleChoiceEditorProps {
  options: string[];
  allowsMultipleSelection: boolean;
  onOptionsChange: (options: string[]) => void;
  onAllowsMultipleSelectionChange: (allowsMultiple: boolean) => void;
}

const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
  options,
  allowsMultipleSelection,
  onOptionsChange,
  onAllowsMultipleSelectionChange
}) => {
  const [newOption, setNewOption] = useState('');

  const addOption = () => {
    if (!newOption.trim()) {
      Alert.alert('Error', 'Please enter an option text');
      return;
    }

    const updatedOptions = [...options, newOption.trim()];
    onOptionsChange(updatedOptions);
    setNewOption('');
  };

  const removeOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    onOptionsChange(updatedOptions);
  };

  const updateOption = (index: number, text: string) => {
    const updatedOptions = [...options];
    updatedOptions[index] = text;
    onOptionsChange(updatedOptions);
  };

  return (
    <View style={styles.container}>
      {options.length === 0 ? (
        <Text style={styles.emptyMessage}>No options added yet</Text>
      ) : (
        options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <TextInput
              style={styles.optionInput}
              value={option}
              onChangeText={(text) => updateOption(index, text)}
              placeholder="Option text"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeOption(index)}
            >
              <AntDesign name="close" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.addOptionRow}>
        <TextInput
          style={styles.newOptionInput}
          value={newOption}
          onChangeText={setNewOption}
          placeholder="Add new option"
          returnKeyType="done"
          onSubmitEditing={addOption}
        />
        <TouchableOpacity
          style={styles.addButton}
          onPress={addOption}
        >
          <AntDesign name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  headerRow: {
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'white',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Purple,
    borderColor: Purple,
  },
  checkboxLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  newOptionInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Purple,
    padding: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  }
});

export default MultipleChoiceEditor; 