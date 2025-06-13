import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const UserContext = createContext();

/**
 * UserProvider component
 * - Wraps the app and provides the current Supabase-authenticated user via context
 * - Subscribes to auth state changes and updates the user state accordingly
 *
 * @param {React.ReactNode} children - Components that will have access to the user context
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch initial user on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Subscribe to auth state changes (e.g., login, logout)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup listener on unmount
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Custom hook to access the authenticated user from context
 * @returns {{ user: object|null }} The current user or null if not logged in
 */
export const useUser = () => useContext(UserContext);
