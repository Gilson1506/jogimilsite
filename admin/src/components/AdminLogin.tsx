import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { BrandLoader } from './BrandLoader';
import { apiFetch, type SessionUser } from '../lib/api';

interface AdminLoginProps {
  theme?: 'dark' | 'light';
  onSetTheme?: (theme: 'dark' | 'light') => void;
  onLoginSuccess: (user: SessionUser) => void;
}

export function AdminLogin({ theme = 'dark', onSetTheme, onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('jogimil_admin_remember_email') || 'admin@jogimiltecnologias.it.ao';
    } catch {
      return 'admin@jogimiltecnologias.it.ao';
    }
  });
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fluxo de Recuperação de Palavra-passe por Email
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  const isDark = theme === 'dark';

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoveryMessage(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Introduza o endereço de email da sua conta.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; message?: string }>(
        '/api/v1/admin/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail }),
        }
      );
      if (res.success) {
        setRecoveryMessage(
          res.message || `Enviámos uma nova palavra-passe temporária para ${cleanEmail}.`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao enviar email de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Introduza um endereço de email corporativo válido.');
      return;
    }
    if (password.length < 4) {
      setError('A palavra-passe deve conter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; user?: SessionUser; message?: string }>(
        '/api/v1/admin/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email: cleanEmail, password }),
        }
      );

      if (!res.success || !res.user) {
        throw new Error(res.message || 'Credenciais inválidas.');
      }

      if (remember) {
        try {
          localStorage.setItem('jogimil_admin_remember_email', cleanEmail);
        } catch {
          // ignore
        }
      }

      onLoginSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao autenticar no servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 app-bg ${
        isDark ? 'theme-dark' : 'theme-light'
      }`}
    >
      {/* Painel Esquerdo Institucional Enterprise */}
      <div
        className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-12 border-r ds-divider relative overflow-hidden"
        style={{ backgroundColor: 'rgb(var(--surface))' }}
      >
        {/* Grelha arquitetural subtil */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex items-center justify-between">
          <img
            src={isDark ? '/logo-white.png' : '/logo-mark.png'}
            alt="JOGIMIL Tecnologias"
            className="h-9 w-auto object-contain"
          />
          <span className="text-[11px] font-mono uppercase tracking-[0.14em] ds-muted">
            Console v2.0 · Luanda
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-brand font-semibold">
            JOGIMIL · Centro de Operações
          </p>
          <h1 className="text-4xl font-semibold tracking-tight leading-[1.15]">
            Gestão omnicanal, CRM de leads e controlo do portal num só painel.
          </h1>
          <p className="text-sm ds-muted leading-relaxed">
            Acompanhe visitas em tempo real, responda a clientes no WhatsApp e Email corporativo,
            organize contactos por interações e publique atualizações diretamente no website.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] ds-subtle font-mono">
          <span>© {new Date().getFullYear()} JOGIMIL - Tecnologias, Lda.</span>
          <span>Urbanização Nova Vida · Luanda, AO</span>
        </div>
      </div>

      {/* Painel Direito: Formulário de Autenticação */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10">
        {/* Topo: Logo mobile + Seletor Claro/Escuro */}
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <img
              src={isDark ? '/logo-white.png' : '/logo-mark.png'}
              alt="JOGIMIL"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div className="ml-auto inline-flex items-center border ds-divider ds-surface-2 p-0.5">
            <button
              type="button"
              onClick={() => onSetTheme?.('light')}
              className={`inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium transition-colors ${
                !isDark ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Sun className="h-3.5 w-3.5" /> Claro
            </button>
            <button
              type="button"
              onClick={() => onSetTheme?.('dark')}
              className={`inline-flex items-center gap-1 px-2.5 h-7 text-[11px] font-medium transition-colors ${
                isDark ? 'bg-brand text-white' : 'ds-muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <Moon className="h-3.5 w-3.5" /> Escuro
            </button>
          </div>
        </div>

        {/* Cartão de Login Retangular */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          {loading ? (
            <div className="ds-card p-12 flex flex-col items-center justify-center">
              <BrandLoader size="lg" theme={theme} />
            </div>
          ) : recoveryMode ? (
            <div className="ds-card p-7 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-brand text-xs font-mono uppercase tracking-wider font-semibold">
                  <KeyRound className="h-4 w-4" />
                  <span>Recuperação de Acesso</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Recuperar Palavra-passe</h2>
                <p className="text-xs ds-muted">
                  Informe o seu email corporativo. Enviaremos automaticamente uma nova palavra-passe segura para a sua caixa de entrada.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {recoveryMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{recoveryMessage}</span>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="label">Email Corporativo</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@jogimiltecnologias.it.ao"
                      className="input pl-9 h-10"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full h-10 text-sm font-semibold">
                  <span>Enviar Nova Palavra-passe por Email</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode(false);
                    setError(null);
                    setRecoveryMessage(null);
                  }}
                  className="btn btn-ghost w-full h-9 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Voltar ao início de sessão</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="ds-card p-7 sm:p-8 space-y-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-brand text-xs font-mono uppercase tracking-wider font-semibold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Acesso Restrito</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">Iniciar Sessão</h2>
                <p className="text-xs ds-muted">
                  Introduza as suas credenciais corporativas para aceder ao painel administrativo.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Corporativo</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@jogimiltecnologias.it.ao"
                      className="input pl-9 h-10"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Palavra-passe</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ds-subtle" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input pl-9 pr-10 h-10"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 ds-muted hover:text-[rgb(var(--text))]"
                      aria-label="Mostrar ou ocultar palavra-passe"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer ds-muted">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#2575FC]"
                    />
                    <span>Manter sessão iniciada</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryMode(true);
                      setError(null);
                      setRecoveryMessage(null);
                    }}
                    className="text-brand font-medium hover:underline"
                  >
                    Esqueceu a palavra-passe?
                  </button>
                </div>

                <button type="submit" className="btn btn-primary w-full h-10 text-sm font-semibold">
                  <span>Entrar no Painel</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] ds-subtle">
          Acesso monitorizado · Ligação segura com o microserviço JOGIMIL
        </p>
      </div>
    </div>
  );
}
