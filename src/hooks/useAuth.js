import { useAppStore } from '../stores/appStore';

// Mock auth for now — will connect to Supabase Auth later
const MOCK_USER = {
  id: '1',
  email: 'admin@scgmex.gob.mx',
  nombre: 'Administrador General',
  rol: 'super_admin',
};

const MOCK_ENTE = {
  id: '1',
  clave: 'MUN-001',
  nombre: 'Municipio de Ejemplo',
  nivel_gobierno: 'municipal',
  tipo_ente: 'municipio',
  entidad_federativa: 'Estado de Mexico',
  municipio: 'Municipio de Ejemplo',
};

const MOCK_EJERCICIO = {
  id: '1',
  anio: 2026,
  fecha_inicio: '2026-01-01',
  fecha_fin: '2026-12-31',
  estado: 'abierto',
};

export function useAuth() {
  const { user, setUser, setEntePublico, setEjercicioFiscal, setRol, logout: storeLogout } = useAppStore();

  const login = async (email, password) => {
    // TODO: Replace with Supabase auth
    setUser(MOCK_USER);
    setEntePublico(MOCK_ENTE);
    setEjercicioFiscal(MOCK_EJERCICIO);
    setRol(MOCK_USER.rol);
    return true;
  };

  const logout = () => {
    storeLogout();
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
