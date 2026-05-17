import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

const PREMIUM_PRODUCT_ID = Platform.OS === 'ios'
  ? 'com.ferfrizzo.MrAndMrsApp.premium_game'
  : 'com.ferfrizzo.mrandmrsapp.premium_game';

export async function getProductPrices(): Promise<{ premium: string }> {
  const products = await Purchases.getProducts([PREMIUM_PRODUCT_ID]);
  const premium = products.find(p => p.identifier === PREMIUM_PRODUCT_ID);
  return { premium: premium?.priceString ?? '—' };
}

export async function purchaseGame(): Promise<void> {
  const products = await Purchases.getProducts([PREMIUM_PRODUCT_ID]);
  if (!products.length) {
    throw new Error('Product not available. Please try again later.');
  }
  await Purchases.purchaseStoreProduct(products[0]);
}
