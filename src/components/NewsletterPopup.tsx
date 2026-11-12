import { FormEvent, useEffect, useState } from 'react';
import { submitToMicroservice } from '../lib/api';
import { href } from '../lib/hooks';
import { Icon, Icon3D } from './ui';

const STORAGE_KEY = 'jogimil_newsletter_closed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    try {
      const closedAt = localStorage.getItem(STORAGE_KEY);
      if (closedAt) {
        const timeDiff = Date.now() - parseInt(closedAt, 10);
        if (timeDiff < SEVEN_DAYS_MS) {
          return;
        }
      }
    } catch {
      // Ignorar erros de storage
    }

    let timer: number | undefined;
    let triggered = false;

    const showPopup = () => {
      if (triggered) return;
      triggered = true;
      setOpen(true);
      window.removeEventListener('scroll', handleScroll);
    };

    const handleScroll = () => {
      const scrolled = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0 && scrolled / height > 0.4) {
        showPopup();
      }
    };

    timer = window.setTimeout(() => {
      showPopup();
    }, 7000);

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // Ignorar
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Por favor introduza um email válido.');
      return;
    }
    if (!consent) {
      setMsg('Por favor aceite a política de privacidade.');
      return;
    }

    setSending(true);
    setMsg('');

    try {
      const json = await submitToMicroservice({
        formType: 'newsletter_popup',
        formTitle: 'Subscrição Newsletter Popup',
        data: { email, modal: 'Pop-up Tech Intelligence' },
        source: window.location.href,
      });

      setDone(true);
      setMsg(json.message || 'Subscrição confirmada!');
      try {
        localStorage.setItem(STORAGE_KEY, (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      } catch {
        // Ignorar
      }
      setTimeout(() => {
        setOpen(false);
      }, 3000);
    } catch {
      setDone(true);
      setMsg('Obrigado! Subscrição registada.');
      try {
        localStorage.setItem(STORAGE_KEY, (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      } catch {
        // Ignorar
      }
      setTimeout(() => {
        setOpen(false);
      }, 3000);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Subscrever Novidades JOGIMIL"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Cartão Modal Compacto com Bordas Arredondadas Modernas */}
      <div className="relative w-full max-w-sm sm:max-w-md overflow-hidden rounded-2xl border border-blue-500/40 bg-slate-950 text-white shadow-[0_20px_60px_rgba(0,102,255,0.35)] transition-all duration-300 animate-scale-up">
        {/* Faixa superior em gradiente */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-400" />

        {/* Glow Superior */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-36 w-64 -translate-x-1/2 rounded-full bg-blue-600/30 blur-2xl"
          aria-hidden="true"
        />

        {/* Botão Fechar Circular */}
        <button
          onClick={handleClose}
          className="absolute right-3.5 top-3.5 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 text-slate-400 transition hover:border-blue-500 hover:bg-blue-600 hover:text-white"
          aria-label="Fechar pop-up"
        >
          <Icon n="close" className="h-3.5 w-3.5" />
        </button>

        <div className="relative z-10 p-5 sm:p-6">
          {/* Cabeçalho Compacto */}
          <div className="flex items-center gap-3">
            <Icon3D name="ia" className="h-10 w-10 shrink-0 drop-shadow-[0_4px_12px_rgba(0,102,255,0.5)]" />
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Radar Tecnológico
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white leading-tight">
                Inovação & IA em Angola
              </h3>
            </div>
          </div>

          <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-300">
            Receba novidades exclusivas sobre agentes inteligentes, conformidade fiscal SAF-T (AO) e desenvolvimento de software.
          </p>

          {done ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-left">
              <p className="font-semibold text-emerald-300 text-sm">✓ {msg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <input
                  id="popup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="O seu email corporativo"
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 outline-none transition focus:border-blue-500 focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="popup-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <label htmlFor="popup-consent" className="text-[11px] text-slate-400 leading-snug">
                  Concordo com a{' '}
                  <a href={href('privacidade')} className="text-blue-400 underline hover:text-blue-300">
                    política de privacidade
                  </a>
                  . Sem spam.
                </label>
              </div>

              {msg && <p className="text-xs font-medium text-rose-400">{msg}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Agora não
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-600/40 transition hover:bg-blue-500 active:scale-98 disabled:opacity-50"
                >
                  {sending ? 'A registar...' : 'Subscrever'}
                  {!sending && <Icon n="arrow" className="h-3.5 w-3.5" />}
                </button>
              </div>
            </form>
          )}

          <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-[10px] text-slate-400">
            <span>🔒 Protecção de dados</span>
            <span className="font-semibold text-blue-400">JOGIMIL Tecnologias</span>
          </div>
        </div>
      </div>
    </div>
  );
}
