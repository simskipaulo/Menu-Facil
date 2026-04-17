import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

const features = ["QR Code para mesas", "Cardápio em tempo real", "Multi-restaurante"];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "super_admin" ? "/admin/restaurants" : "/admin/menu-items");
    } catch {
      setError("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left panel — brand */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-3/5 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 60%, #3b82f6 100%)" }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 bg-white blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-10 bg-blue-300 blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 text-center max-w-xs">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm mx-auto mb-6 overflow-hidden border border-white/30">
            <img src="/logo.png" alt="Menu Fácil" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Menu Fácil</h1>
          <p className="text-blue-200 text-base leading-relaxed">
            Gerencie seu cardápio digital com facilidade
          </p>
          <div className="mt-10 space-y-3 text-left">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3 text-blue-100 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden text-center mb-10">
            <div className="w-14 h-14 rounded-2xl overflow-hidden mx-auto mb-3 border border-neutral-100">
              <img src="/logo.png" alt="Menu Fácil" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">Menu Fácil</h1>
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 mb-1">Bem-vindo de volta</h2>
          <p className="text-neutral-500 text-sm mb-8">Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="field-label">Senha</label>
              <div className="relative">
                <input
                  className="form-input pr-11"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger-50 border border-danger-100 rounded-xl px-4 py-2.5">
                <p className="text-danger-600 text-sm">{error}</p>
              </div>
            )}

            <button
              className="btn-primary w-full py-3 text-base mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
