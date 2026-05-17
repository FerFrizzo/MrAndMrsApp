import { GameQuestion } from '../types/GameData';

export interface QuestionPackage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  questions: Omit<GameQuestion, 'id' | 'game_id' | 'order_num'>[];
}

export const QUESTION_PACKAGES: QuestionPackage[] = [
  {
    id: 'romantic',
    name: 'Romantic',
    description: 'Sweet questions about your relationship',
    emoji: '💕',
    questions: [
      { question_text: 'Where did we go on our first date?', question_type: 'text' },
      { question_text: 'What was I wearing when we first met?', question_type: 'text' },
      { question_text: 'What is my love language?', question_type: 'multiple_choice', multiple_choice_options: ['Words of Affirmation', 'Physical Touch', 'Acts of Service', 'Quality Time', 'Gifts'], allow_multiple_selection: false },
      { question_text: 'What song do I consider "our song"?', question_type: 'text' },
      { question_text: 'Would I rather spend a romantic night in or out?', question_type: 'true_false' },
    ],
  },
  {
    id: 'fun',
    name: 'Fun & Games',
    description: 'Silly and lighthearted party questions',
    emoji: '🎉',
    questions: [
      { question_text: 'What is my go-to karaoke song?', question_type: 'text' },
      { question_text: 'What is my biggest guilty pleasure?', question_type: 'text' },
      { question_text: 'Which superpower would I choose?', question_type: 'multiple_choice', multiple_choice_options: ['Invisibility', 'Flying', 'Mind Reading', 'Super Strength'], allow_multiple_selection: false },
      { question_text: 'Am I more likely to be the life of the party?', question_type: 'true_false' },
      { question_text: 'What would I order at a fast food restaurant?', question_type: 'text' },
    ],
  },
  {
    id: 'deep',
    name: 'Deep Dive',
    description: 'Thoughtful questions about dreams and values',
    emoji: '🌊',
    questions: [
      { question_text: 'What is my biggest dream in life?', question_type: 'text' },
      { question_text: 'What is something I am most proud of?', question_type: 'text' },
      { question_text: 'Where do I see us living in 10 years?', question_type: 'text' },
      { question_text: 'Would I rather have more money or more free time?', question_type: 'true_false' },
      { question_text: 'What is my biggest fear?', question_type: 'text' },
    ],
  },
  {
    id: 'wedding',
    name: 'Wedding Day',
    description: 'Perfect for the big day celebration',
    emoji: '💍',
    questions: [
      { question_text: 'What was the first thing I said when I saw you on our wedding day?', question_type: 'text' },
      { question_text: 'Which part of the wedding am I most excited about?', question_type: 'multiple_choice', multiple_choice_options: ['The Ceremony', 'The Party', 'The Honeymoon', 'The Photos'], allow_multiple_selection: false },
      { question_text: 'What song will we dance to at our wedding?', question_type: 'text' },
      { question_text: 'Did I cry during the ceremony?', question_type: 'true_false' },
      { question_text: 'Where are we going on our honeymoon?', question_type: 'text' },
    ],
  },
];
