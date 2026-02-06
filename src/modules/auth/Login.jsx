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
    <div className="min-h-screen relative flex items-center justify-center p-6 overflow-hidden bg-[#080808]">
      {/* Abstract background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-guinda/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-guinda-dark/30 blur-[140px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-dorado/8 blur-[120px]" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[480px]">
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-12 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-guinda to-guinda-dark rounded-2xl flex items-center justify-center shadow-lg shadow-guinda/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#BC955C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-dorado rounded-full border-[3px] border-[#080808]" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white tracking-wide">SCGMEX</h1>
            <p className="text-white/30 text-base mt-2">Contabilidad Gubernamental</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-base placeholder:text-white/25 focus:outline-none focus:border-guinda/60 focus:bg-white/[0.08] transition-all"
                placeholder="Correo electronico"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-white/[0.06] border border-white/[0.08] rounded-xl text-white text-base placeholder:text-white/25 focus:outline-none focus:border-guinda/60 focus:bg-white/[0.08] transition-all"
                placeholder="Contrasena"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-guinda text-white font-semibold rounded-xl hover:bg-guinda-light active:scale-[0.98] transition-all disabled:opacity-50 text-base mt-1 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          {/* Demo hint */}
          <p className="text-white/20 text-sm text-center mt-8">
            Demo — cualquier credencial es valida
          </p>
        </div>

        {/* Bottom subtle branding */}
        <div className="flex items-center justify-center gap-2.5 mt-8">
          <div className="w-1.5 h-1.5 rounded-full bg-dorado/40" />
          <span className="text-white/15 text-xs tracking-widest uppercase">Gobierno de Mexico</span>
          <div className="w-1.5 h-1.5 rounded-full bg-dorado/40" />
        </div>
      </div>
    </div>
  );
}
