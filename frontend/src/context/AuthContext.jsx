import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [merchantSettings, setMerchantSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch Merchant Settings from 'merchants' table
  const fetchMerchantSettings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching merchant profile:', error.message);
      } else if (data) {
        setMerchantSettings(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching settings:', err);
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchMerchantSettings(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes (Login, Logout, Sign Up)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMerchantSettings(session.user.id);
      } else {
        setMerchantSettings(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register New Merchant
  const register = async (email, password, merchantName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          merchant_name: merchantName, // Send metadata to Supabase Auth
        },
      },
    });

    if (error) throw error;

    return data;
  };

  // Login
  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // Logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        merchantSettings,
        loading,
        login,
        register,
        logout,
        fetchMerchantSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);