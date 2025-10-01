// Temporary auth helper - will be replaced with Supabase Auth

const AUTH_KEY = "temp_auth";

// Dummy credentials for development/testing only - NOT real secrets
// These are intentional placeholder values that will be removed when Supabase Auth is implemented
export const DUMMY_CREDENTIALS = {
  email: "demo@getmehired.com", // ggignore
  password: "demo123", // ggignore
};

export const authHelpers = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_KEY) === "true";
  },

  // Login with dummy credentials
  login: (email: string, password: string): boolean => {
    if (
      email === DUMMY_CREDENTIALS.email &&
      password === DUMMY_CREDENTIALS.password
    ) {
      localStorage.setItem(AUTH_KEY, "true");
      return true;
    }
    return false;
  },

  // Logout
  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },
};
