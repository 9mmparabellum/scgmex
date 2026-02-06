import { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { useAppStore } from '../stores/appStore';

export function useAuth() {
  const { user, setUser, setEntePublico, setEjercicioFiscal, setRol, logout: storeLogout } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        storeLogout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(authId) {
    try {
      // Fetch user profile from usuarios table
      const { data: profile, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (profileError || !profile) {
        // Try matching by email as fallback
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const { data: profileByEmail } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', authUser.email)
            .single();

          if (profileByEmail) {
            // Link auth_id if not set
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
        console.error('User profile not found');
        return;
      }

      await setProfileContext(profile);
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

    // Fetch ente publico
    if (profile.ente_id) {
      const { data: ente } = await supabase
        .from('ente_publico')
        .select('*')
        .eq('id', profile.ente_id)
        .single();
      if (ente) setEntePublico(ente);
    } else {
      // If no ente_id assigned, get the first available ente
      const { data: entes } = await supabase
        .from('ente_publico')
        .select('*')
        .eq('activo', true)
        .limit(1);
      if (entes?.length) setEntePublico(entes[0]);
    }

    // Fetch active ejercicio fiscal
    const enteId = profile.ente_id || (await supabase.from('ente_publico').select('id').eq('activo', true).limit(1)).data?.[0]?.id;
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.user) {
      await loadUserProfile(data.user.id);
    }

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    storeLogout();
  };

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };
}
