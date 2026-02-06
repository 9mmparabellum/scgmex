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
    <div className="min-h-screen flex flex-col">
      {/* Top gold stripe */}
      <div className="h-1.5 bg-dorado" />

      {/* Government header bar */}
      <div className="bg-guinda-dark px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-dorado rounded flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#621132" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-semibold tracking-wide">Gobierno de Mexico</div>
            </div>
          </div>
          <div className="text-white/40 text-xs hidden sm:block">gob.mx</div>
        </div>
      </div>

      {/* Main content — split layout */}
      <div className="flex-1 flex">
        {/* Left panel — branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-guinda-dark relative overflow-hidden">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />

          <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
            {/* Logo */}
            <div className="w-24 h-24 bg-dorado rounded-xl flex items-center justify-center mb-8 shadow-lg">
              <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#621132" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-white tracking-wider mb-3">SCGMEX</h1>
            <div className="w-16 h-0.5 bg-dorado mb-4" />
            <p className="text-white/60 text-center text-sm leading-relaxed max-w-xs">
              Sistema de Contabilidad Gubernamental de Mexico
            </p>

            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-dorado text-2xl font-bold">13</div>
                <div className="text-white/40 text-[10px] mt-1">Modulos</div>
              </div>
              <div>
                <div className="text-dorado text-2xl font-bold">86</div>
                <div className="text-white/40 text-[10px] mt-1">Articulos LGCG</div>
              </div>
              <div>
                <div className="text-dorado text-2xl font-bold">19</div>
                <div className="text-white/40 text-[10px] mt-1">Reportes</div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-3 text-white/30 text-[10px]">
              <span>Federal</span>
              <span className="w-1 h-1 rounded-full bg-dorado/50" />
              <span>Estatal</span>
              <span className="w-1 h-1 rounded-full bg-dorado/50" />
              <span>Municipal</span>
            </div>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="flex-1 bg-[#F8F8F8] flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Mobile-only branding */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-guinda-dark rounded-xl mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BC955C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-guinda-dark">SCGMEX</h1>
              <p className="text-text-muted text-xs mt-1">Sistema de Contabilidad Gubernamental</p>
            </div>

            {/* Form card */}
            <div className="bg-white rounded-lg shadow-sm border border-border/50 overflow-hidden">
              {/* Card header */}
              <div className="bg-guinda-dark px-8 py-5">
                <h2 className="text-white font-semibold">Iniciar Sesion</h2>
                <p className="text-white/50 text-xs mt-1">Ingresa tus credenciales para acceder al sistema</p>
              </div>

              {/* Card body */}
              <form onSubmit={handleSubmit} className="p-8">
                {error && (
                  <div className="mb-5 p-3 bg-danger/5 border border-danger/20 rounded flex items-center gap-2 text-danger text-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Correo electronico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-border rounded bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-guinda/20 focus:border-guinda transition-colors"
                      placeholder="usuario@gobierno.gob.mx"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Contrasena
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-border rounded bg-white text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-guinda/20 focus:border-guinda transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-guinda text-white font-medium rounded hover:bg-guinda-light active:bg-guinda-dark transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Ingresando...
                    </>
                  ) : 'Ingresar al Sistema'}
                </button>
              </form>
            </div>

            {/* Demo notice */}
            <div className="mt-5 p-4 bg-white rounded-lg border border-dorado/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-dorado/10 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A07A3E" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-dorado-dark">Modo Demostracion</p>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    Ingresa cualquier correo y contrasena para explorar el sistema con datos de ejemplo.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-text-muted text-[10px]">
                Ley General de Contabilidad Gubernamental &bull; DOF 16-07-2025
              </p>
              <p className="text-text-muted/50 text-[10px] mt-1">
                Art. 1-86 &bull; CONAC &bull; Armonizacion Contable
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
