export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  PasswordRecovery: undefined;
  Dashboard: undefined;
  CreateGame: undefined;
  GameQuestion: { gameId: string };
  GameDetails: { gameId: string };
  MainTabs: undefined;
  ReviewAnswers: { gameId: string };
  GameResult: { gameId: string };
  Account: undefined;
}; 