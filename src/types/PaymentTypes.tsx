// Types
export type PaymentError = {
  message: string;
  code?: string;
};

export type PaymentResult = {
  success: boolean;
  error: PaymentError | null;
};

export type PaymentIntentResult = {
  clientSecret: string | null;
  error: Error | null;
};