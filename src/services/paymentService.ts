import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';

export async function fetchPaymentSheetParams(price: number) {
  // Call your Supabase Edge Function to create a PaymentIntent, Ephemeral Key, and Customer
  const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: price, currency: 'usd' }),
  });
  return response.json();
}

export async function openPaymentSheet(price: number) {
  const { paymentIntent, ephemeralKey, customer, error } = await fetchPaymentSheetParams(price);
  if (error) throw new Error(error);

  const { error: initError } = await initPaymentSheet({
    merchantDisplayName: 'Mr & Mrs Game',
    customerId: customer,
    customerEphemeralKeySecret: ephemeralKey,
    paymentIntentClientSecret: paymentIntent,
    allowsDelayedPaymentMethods: false,
    style: 'automatic',
    googlePay: {
      merchantCountryCode: 'US',
      currencyCode: 'USD',
      testEnv: false
    }
  });
  if (initError) throw new Error(initError.message);

  const { error: presentError } = await presentPaymentSheet();
  if (presentError) throw new Error(presentError.message);

  return true;
} 