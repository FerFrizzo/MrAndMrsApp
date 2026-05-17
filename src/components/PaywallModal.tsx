import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Purple } from '../utils/Colors';
import { getProductPrices, purchaseGame } from '../services/paymentService';

interface PaywallModalProps {
  visible: boolean;
  onUpgradeSuccess: () => void;
  onContinueFree: () => void;
}

const PREMIUM_FEATURES = [
  { icon: 'camera' as const, label: 'Partner answers with photos' },
  { icon: 'video' as const, label: 'Partner answers with videos' },
  { icon: 'star-circle' as const, label: 'Richer results reveal moment' },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onUpgradeSuccess,
  onContinueFree,
}) => {
  const [price, setPrice] = useState('—');
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      getProductPrices()
        .then(p => setPrice(p.premium))
        .catch(() => {});
    }
  }, [visible]);

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      await purchaseGame();
      onUpgradeSuccess();
    } catch (e: any) {
      if (!e?.message?.toLowerCase().includes('cancel')) {
        // Non-cancellation error — StoreKit already surfaces its own UI
      }
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onContinueFree}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <MaterialCommunityIcons name="crown" size={44} color="#FFCC00" style={styles.crown} />
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Make the reveal more fun — let your partner answer with photos and videos
          </Text>

          <View style={styles.features}>
            {PREMIUM_FEATURES.map(f => (
              <View key={f.icon} style={styles.featureRow}>
                <MaterialCommunityIcons name={f.icon} size={22} color={Purple} />
                <Text style={styles.featureText}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.upgradeButton, purchasing && styles.upgradeButtonDisabled]}
            onPress={handleUpgrade}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.upgradeButtonText}>
                Upgrade Now{price !== '—' ? ` — ${price}` : ''}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.freeButton}
            onPress={onContinueFree}
            disabled={purchasing}
          >
            <Text style={styles.freeButtonText}>Continue with free game</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 20,
  },
  crown: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  features: {
    width: '100%',
    marginBottom: 28,
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
  },
  upgradeButton: {
    backgroundColor: Purple,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  freeButton: {
    paddingVertical: 10,
  },
  freeButtonText: {
    color: '#888',
    fontSize: 15,
  },
});
