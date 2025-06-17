import { supabase } from '../config/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
  updated_at: string | null;
}

export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw error;
    }

    return { profile: data as UserProfile, error: null };
  } catch (error: any) {
    console.error('Error fetching user profile:', error.message);
    return { profile: null, error };
  }
} 