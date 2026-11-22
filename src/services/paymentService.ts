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

export async function purchaseGame(): Promise<{ productId: string }> {
  const products = await Purchases.getProducts([PREMIUM_PRODUCT_ID]);
  if (!products.length) {
    throw new Error('Product not available. Please try again later.');
  }
  const result = await Purchases.purchaseStoreProduct(products[0]);
  return { productId: result.productIdentifier || products[0].identifier };
}

// RevenueCat identity. The app user id is the Supabase uid — the same id
// PostHog identifies with — so purchases, refunds and revenue (via the
// RevenueCat → PostHog integration) land on the right person.
//
// Sign-in can arrive before configure (AnalyticsInitializer's effect runs
// before App's), so the wanted user is remembered and applied on configure.
// Calls are chained so a quick sign-out/sign-in never interleaves.
let configured = false;
let wantedUid: string | null | undefined;
// undefined = unknown: RevenueCat keeps the last customer across launches.
let appliedUid: string | null | undefined;
let queue: Promise<void> = Promise.resolve();

function syncUser(): Promise<void> {
  queue = queue.then(async () => {
    if (!configured || wantedUid === undefined || wantedUid === appliedUid) return;
    const uid = wantedUid;
    try {
      if (uid) {
        await Purchases.logIn(uid);
      } else if (!(await Purchases.isAnonymous())) {
        // logOut() throws for an anonymous customer.
        await Purchases.logOut();
      }
      appliedUid = uid;
    } catch (e) {
      console.warn('RevenueCat user sync failed:', e);
    }
  });
  return queue;
}

export function configurePurchases(apiKey: string): void {
  try {
    Purchases.configure({ apiKey });
    configured = true;
    void syncUser();
  } catch (e) {
    console.warn('RevenueCat configure failed:', e);
  }
}

export function setPurchasesUser(uid: string | null): Promise<void> {
  wantedUid = uid;
  return syncUser();
}

export function __resetPurchasesForTests(): void {
  configured = false;
  wantedUid = undefined;
  appliedUid = undefined;
  queue = Promise.resolve();
}
