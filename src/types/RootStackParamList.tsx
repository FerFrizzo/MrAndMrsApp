export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  PasswordRecovery: undefined;
  Dashboard: undefined;
  CreateGame: { premium?: boolean } | undefined;
  GameQuestion: { gameId: string };
  GameDetails: { gameId: string };
  MainTabs: undefined;
  ReviewAnswers: { gameId: string };
  GameResult: { gameId: string };
  Account: undefined;
}; 