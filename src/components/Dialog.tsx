import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
  Animated,
} from 'react-native';
import { Purple, Pink, Gray } from '../utils/Colors';

export type DialogType = 'confirm' | 'warning' | 'error';

export interface DialogButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: DialogButton[];
  type?: DialogType;
  onDismiss?: () => void;
}

export const Dialog: React.FC<DialogProps> = ({
  visible,
  title,
  message,
  buttons,
  type = 'confirm',
  onDismiss,
}) => {
  const getButtonStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      case 'cancel':
        return [styles.button, styles.cancelButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (style?: 'default' | 'cancel' | 'destructive') => {
    switch (style) {
      case 'destructive':
        return [styles.buttonText, styles.destructiveButtonText];
      case 'cancel':
        return [styles.buttonText, styles.cancelButtonText];
      default:
        return [styles.buttonText, styles.defaultButtonText];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    getButtonStyle(button.style),
                    index > 0 && styles.buttonMargin
                  ]}
                  onPress={() => {
                    button.onPress();
                    onDismiss?.();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 340,
    backgroundColor: 'white',
    borderRadius: 14,
    overflow: 'hidden',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMargin: {
    marginTop: 8,
  },
  defaultButton: {
    backgroundColor: Purple,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Gray,
  },
  destructiveButton: {
    backgroundColor: Pink,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  defaultButtonText: {
    color: 'white',
  },
  cancelButtonText: {
    color: Gray,
  },
  destructiveButtonText: {
    color: 'white',
  },
}); 