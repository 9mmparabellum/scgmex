import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        navigate(ROUTES.DASHBOARD);
      } else {
        setError('Credenciales invalidas');
      }
    } catch {
      setError('Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-guinda-dark flex flex-col">
      {/* Top gold stripe */}
      <div className="h-1 bg-dorado" />

      {/* Header bar */}
      <div className="bg-guinda-dark border-b border-guinda/30 px-6 py-3">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <div className="w-7 h-7 bg-dorado rounded flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#621132" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
            </svg>
          </div>
          <span className="text-white/60 text-xs">Gobierno de Mexico</span>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-dorado rounded-lg mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#621132" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">SCGMEX</h1>
            <p className="text-white/50 text-sm mt-1">Sistema de Contabilidad Gubernamental</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl p-8">
            <h2 className="text-lg font-semibold text-text-primary mb-6">Iniciar Sesion</h2>

            {error && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Correo electronico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded bg-bg-main text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-guinda/30 focus:border-guinda"
                placeholder="usuario@gobierno.gob.mx"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Contrasena
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded bg-bg-main text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-guinda/30 focus:border-guinda"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-guinda text-white font-medium rounded hover:bg-guinda-light transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <div className="mt-4 p-3 bg-dorado/10 border border-dorado/30 rounded">
              <p className="text-xs text-dorado-dark font-medium mb-1">Modo Demo</p>
              <p className="text-xs text-text-muted">
                Ingresa cualquier correo y contrasena para acceder al sistema de demostracion.
              </p>
            </div>
          </form>

          <p className="text-center text-white/30 text-[10px] mt-6">
            LGCG DOF 16-07-2025 &bull; Art. 1-86
          </p>
        </div>
      </div>
    </div>
  );
}
