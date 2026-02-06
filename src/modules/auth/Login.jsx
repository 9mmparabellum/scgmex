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
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
            <span className="text-primary-dark font-bold text-xl">SCG</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SCGMEX</h1>
          <p className="text-text-sidebar text-sm mt-1">Sistema de Contabilidad Gubernamental</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-bg-card rounded-xl shadow-2xl p-8">
          <h2 className="text-lg font-semibold text-text-primary mb-6">Iniciar Sesion</h2>

          {error && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
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
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-bg-main text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-bg-main text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <div className="mt-4 p-3 bg-info/10 border border-info/30 rounded-lg">
            <p className="text-xs text-info font-medium mb-1">Modo Demo</p>
            <p className="text-xs text-text-muted">
              Ingresa cualquier correo y contrasena para acceder al sistema de demostracion.
            </p>
          </div>
        </form>

        <p className="text-center text-text-sidebar text-[10px] mt-6">
          LGCG DOF 16-07-2025 &bull; Art. 1-86
        </p>
      </div>
    </div>
  );
}
