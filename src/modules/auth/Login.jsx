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
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0a]">
      {/* Abstract background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-guinda/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-guinda-dark/30 blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-dorado/8 blur-[100px]" />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      }} />

      {/* Card */}
      <div className="relative w-full max-w-[420px]">
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-10 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-guinda to-guinda-dark rounded-xl flex items-center justify-center shadow-lg shadow-guinda/20">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BC955C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-dorado rounded-full border-2 border-[#0a0a0a]" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-wide">SCGMEX</h1>
            <p className="text-white/30 text-sm mt-1.5">Contabilidad Gubernamental</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-guinda/60 focus:bg-white/[0.08] transition-all"
                placeholder="Correo electronico"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/[0.08] rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-guinda/60 focus:bg-white/[0.08] transition-all"
                placeholder="Contrasena"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-guinda text-white font-medium rounded-lg hover:bg-guinda-light active:scale-[0.98] transition-all disabled:opacity-50 text-sm mt-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          {/* Demo hint */}
          <p className="text-white/20 text-xs text-center mt-6">
            Demo — cualquier credencial es valida
          </p>
        </div>

        {/* Bottom subtle branding */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-1 h-1 rounded-full bg-dorado/40" />
          <span className="text-white/15 text-[11px] tracking-wider uppercase">Gobierno de Mexico</span>
          <div className="w-1 h-1 rounded-full bg-dorado/40" />
        </div>
      </div>
    </div>
  );
}
