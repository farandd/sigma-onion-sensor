import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, SystemType } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  passwordRecovery: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, systemType: SystemType) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getSystemType(value: unknown): SystemType {
  return value === 'panel' ? 'panel' : 'portable';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await fetchProfile(session.user);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(authUser: User) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    const { data: createdProfile } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        full_name: authUser.user_metadata?.full_name ?? '',
        system_type: getSystemType(authUser.user_metadata?.system_type),
      }, { onConflict: 'id' })
      .select()
      .maybeSingle();

    setProfile(createdProfile ?? null);
    setLoading(false);
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    setPasswordRecovery(false);
    return { error: null };
  }

  async function signUp(email: string, password: string, fullName: string, systemType: SystemType) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          system_type: systemType,
        },
      },
    });
    if (error) return { error: error.message };

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return { error: 'Email ini sudah terdaftar. Silakan masuk.' };
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        system_type: systemType,
      }, { onConflict: 'id' });

      if (profileError && !profileError.message.toLowerCase().includes('duplicate key')) {
        return { error: 'Gagal menyiapkan profil pengguna. Silakan coba lagi.' };
      }
    }

    return { error: null };
  }

  async function resetPassword(email: string) {
    const redirectTo = typeof window !== 'undefined'
      ? window.location.origin
      : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    setPasswordRecovery(false);
    await supabase.auth.signOut();
    return { error: null };
  }

  async function signOut() {
    setPasswordRecovery(false);
    await supabase.auth.signOut();
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) setProfile(data);
  }

  return (
    <AuthContext.Provider value={{ user, session, profile, passwordRecovery, loading, signIn, signUp, resetPassword, updatePassword, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
