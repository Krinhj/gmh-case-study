import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Helper function to clear user-specific cached data
const clearUserCache = () => {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('job_applications_') || key.startsWith('user_profile_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

export const authHelpers = {
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session error:", error);
        return false;
      }
      return !!session;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      // First try to get from session (more reliable)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return session.user;
      }

      // Fallback to getUser
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Get user error:", error);
        return null;
      }
      return user;
    } catch (error) {
      console.error("Get current user error:", error);
      return null;
    }
  },

  // Get current session
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    });

    return { data, error };
  },

  // Login with email and password
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Clear any existing cached data from previous session
    if (data.user) {
      clearUserCache();
    }

    return { data, error };
  },

  // Login with Google OAuth
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { data, error };
  },

  // Logout
  logout: async () => {
    // Clear all cached user data from localStorage
    clearUserCache();

    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};


