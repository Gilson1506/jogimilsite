import { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Server,
  KeyRound,
} from 'lucide-react';

interface AdminLoginProps {
  theme?: 'dark' | 'light';
  onLoginSuccess: (user: { name: string; email: string; role: string }) => void;
}

export function AdminLogin({ theme = 'dark', onLoginSuccess }: AdminLoginProps) {
  const isDark = theme === 'dark';

  const [email, setEmail] = useState('admin@jogimiltecnologias.it.ao');
  const [password, setPassword] = useState('admin2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      // Simulação de autenticação corporativa segura
      if (email.trim() && password.length >= 6) {
        onLoginSuccess({
          name: 'Joel Gaspar',
          email: email.trim(),
          role: 'Administrador Executivo',
        });
      } else {
        setError('Credenciais inválidas. Verifique o seu e-mail e palavra-passe.');
        setLoading(false);
      }
    }, 800);
  };

  const handleFillDemo = () => {
    setEmail('admin@jogimiltecnologias.it.ao');
    setPassword('admin2026');
    setError(null);
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? 'bg-[#060911] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}
    >
      {/* Background glow & subtle grid */}
      <div
        className={`fixed inset-0 pointer-events-none transition-opacity duration-500 ${
          isDark
            ? 'opacity-40 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(0,102,255,0.35),rgba(255,255,255,0))]'
            : 'opacity-25 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(0,102,255,0.20),rgba(255,255,255,0))]'
        }`}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Main Login Card */}
        <div
          className={`rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
            isDark
              ? 'bg-[#090D16]/95 border-[#1E293B] shadow-blue-950/40'
              : 'bg-white/95 border-slate-200 shadow-slate-200/60'
          }`}
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={isDark ? '/logo-white.png' : '/logo-mark.png'}
                alt="JOGIMIL"
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  // Fallback se imagem demorar a carregar
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xl font-bold tracking-tight">
                JOGIMIL<span className="text-blue-500 font-normal">.Admin</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-2 bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Painel Executivo & Omnicanal</span>
            </div>

            <h1 className="text-lg font-bold text-inherit">Acesso Restrito</h1>
            <p className="text-xs text-slate-400 mt-1">
              Introduza as suas credenciais para aceder ao centro omnicanal e CRM
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-slate-300">
                Email Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jogimiltecnologias.it.ao"
                  className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Palavra-passe
                </label>
                <a
                  href="#recuperar-senha"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Por favor contacte o suporte de infraestrutura em suporte@jogimiltecnologias.it.ao para redefinir o acesso.');
                  }}
                  className="text-[11px] font-medium text-blue-500 hover:text-blue-400 transition"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-none font-medium transition ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700/80 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-200 transition"
                  title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                />
                <span>Manter sessão iniciada</span>
              </label>

              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SSL 256-bit
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs text-white bg-[#0066FF] hover:bg-blue-600 active:scale-[0.99] shadow-lg shadow-blue-600/30 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A autenticar na Cloud JOGIMIL...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel Executivo</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-5 border-t border-inherit flex flex-col items-center gap-2">
            <span className="text-[11px] text-slate-500">Credenciais rápidas de demonstração:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <KeyRound className="h-3.5 w-3.5 text-blue-500" />
              <span>Preencher demo (admin@jogimiltecnologias.it.ao)</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Server className="h-3.5 w-3.5 text-blue-500" />
            <span>JOGIMIL Cloud Infrastructure · Luanda DC-1 (Angola)</span>
          </div>
          <span className="text-[10px] text-slate-600">
            Conformidade AGT 2026 & Proteção de Dados
          </span>
        </div>
      </div>
    </div>
  );
}
