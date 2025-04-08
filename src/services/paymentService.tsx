import { supabase } from '../config/supabaseClient';
import { Alert } from 'react-native';
import { initStripe, presentPaymentSheet, PaymentSheetError } from '@stripe/stripe-react-native';
import { PaymentResult } from '../types/PaymentTypes';


// Initialize Stripe
export const initializeStripe = async (publishableKey: string) => {
  try {
    await initStripe({
      publishableKey,
    });
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const createPaymentIntent = async (amount: number, gameId: string, packId?: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Call your Supabase function to create a payment intent
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: {
        amount,
        gameId,
        packId,
        userId: user.id
      }
    });

    if (error) throw error;

    return { clientSecret: data.clientSecret, error: null };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return { clientSecret: null, error: error as Error };
  }
};

// Process the payment with the payment sheet
export const processPayment = async (clientSecret: string): Promise<PaymentResult> => {
  try {
    // Open the payment sheet
    const { error: paymentSheetError } = await presentPaymentSheet({
      // @ts-ignore - clientSecret is valid but TypeScript doesn't recognize it
      clientSecret,
    });

    if (paymentSheetError) {
      if (paymentSheetError.code === 'Canceled') {
        return { success: false, error: { message: 'Payment cancelled', code: 'Canceled' } };
      }
      throw paymentSheetError;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { success: false, error: { message: (error as Error).message } };
  }
};

// Complete the payment flow for a game
export const purchaseGame = async (gameId: string, isPremium: boolean): Promise<PaymentResult> => {
  try {
    // Calculate the amount based on the game type
    const amount = isPremium ? 499 : 299; // $4.99 or $2.99 in cents

    // Create a payment intent
    const { clientSecret, error: intentError } = await createPaymentIntent(amount, gameId);

    if (intentError) throw intentError;
    if (!clientSecret) throw new Error('Failed to create payment intent');

    // Process the payment
    const { success, error: paymentError } = await processPayment(clientSecret);

    if (paymentError) throw paymentError;

    if (success) {
      // Update the game status to paid
      const { error: updateError } = await supabase
        .from('games')
        .update({
          payment_status: 'paid',
          is_premium: isPremium
        })
        .eq('id', gameId);

      if (updateError) throw updateError;

      return { success: true, error: null };
    }

    return { success: false, error: { message: 'Payment failed' } };
  } catch (error) {
    console.error('Error purchasing game:', error);
    return { success: false, error: { message: (error as Error).message } };
  }
};

// Purchase add-on question packs
export const purchaseQuestionPack = async (packId: string, price: number): Promise<PaymentResult> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('User not authenticated');

    // Create a payment intent for the question pack
    const { clientSecret, error: intentError } = await createPaymentIntent(price, '', packId);

    if (intentError) throw intentError;
    if (!clientSecret) throw new Error('Failed to create payment intent');

    // Process the payment
    const { success, error: paymentError } = await processPayment(clientSecret);

    if (paymentError) throw paymentError;

    if (success) {
      // Add the question pack to the user's library
      const { error: insertError } = await supabase
        .from('user_question_packs')
        .insert({
          user_id: user.id,
          pack_id: packId,
          purchased_at: new Date()
        });

      if (insertError) throw insertError;

      return { success: true, error: null };
    }

    return { success: false, error: { message: 'Payment failed' } };
  } catch (error) {
    console.error('Error purchasing question pack:', error);
    return { success: false, error: { message: (error as Error).message } };
  }
};