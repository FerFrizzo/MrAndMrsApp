import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

export const PRODUCT_IDS = Platform.OS === 'ios'
  ? {
      basic: 'com.ferfrizzo.MrAndMrsApp.basic_game',
      premium: 'com.ferfrizzo.MrAndMrsApp.premium_game',
    }
  : {
      basic: 'com.ferfrizzo.mrandmrsapp.basic_game',
      premium: 'com.ferfrizzo.mrandmrsapp.premium_game',
    };

export async function getProductPrices(): Promise<{ basic: string; premium: string }> {
  const products = await Purchases.getProducts(Object.values(PRODUCT_IDS));
  const basic = products.find(p => p.identifier === PRODUCT_IDS.basic);
  const premium = products.find(p => p.identifier === PRODUCT_IDS.premium);
  return {
    basic: basic?.priceString ?? '—',
    premium: premium?.priceString ?? '—',
  };
}

export async function purchaseGame(tier: 'basic' | 'premium'): Promise<void> {
  const products = await Purchases.getProducts([PRODUCT_IDS[tier]]);

  if (!products.length) {
    throw new Error('Product not available. Please try again later.');
  }

  await Purchases.purchaseStoreProduct(products[0]);
}
