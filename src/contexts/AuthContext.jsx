import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { useAppStore } from '../stores/appStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, setUser, setEntePublico, setEjercicioFiscal, setRol, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(true);
  const profileLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (session?.user && !profileLoadedRef.current) {
        await loadUserProfile(session.user.id);
        profileLoadedRef.current = true;
      }
      if (!cancelled) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        profileLoadedRef.current = false;
        storeLogout();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function loadUserProfile(authId) {
    try {
      // Primary: lookup by auth_id
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (!profileError && profile) {
        await setProfileContext(profile);
        return;
      }

      // Fallback: lookup by email and link auth_id
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        const { data: profileByEmail } = await supabase
          .from('usuarios')
          .select('*')
          .eq('email', authUser.email)
          .single();

        if (profileByEmail) {
          if (!profileByEmail.auth_id) {
            await supabase
              .from('usuarios')
              .update({ auth_id: authId })
              .eq('id', profileByEmail.id);
          }
          await setProfileContext(profileByEmail);
          return;
        }
      }
      console.warn('User profile not found for auth_id:', authId);
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  }

  async function setProfileContext(profile) {
    setUser({
      id: profile.id,
      email: profile.email,
      nombre: profile.nombre,
      rol: profile.rol,
    });
    setRol(profile.rol);

    let enteId = profile.ente_id;
    if (enteId) {
      const { data: ente } = await supabase
        .from('ente_publico')
        .select('*')
        .eq('id', enteId)
        .single();
      if (ente) setEntePublico(ente);
    } else {
      const { data: entes } = await supabase
        .from('ente_publico')
        .select('*')
        .eq('activo', true)
        .limit(1);
      if (entes?.length) {
        setEntePublico(entes[0]);
        enteId = entes[0].id;
      }
    }

    if (enteId) {
      const { data: ejercicios } = await supabase
        .from('ejercicio_fiscal')
        .select('*')
        .eq('ente_id', enteId)
        .eq('estado', 'abierto')
        .order('anio', { ascending: false })
        .limit(1);
      if (ejercicios?.length) setEjercicioFiscal(ejercicios[0]);
    }
  }

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data?.user) {
      await loadUserProfile(data.user.id);
      profileLoadedRef.current = true;
    }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    profileLoadedRef.current = false;
    storeLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
