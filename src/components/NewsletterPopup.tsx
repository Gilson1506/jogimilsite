import { FormEvent, useEffect, useState } from 'react';
import { submitToMicroservice } from '../lib/api';
import { href } from '../lib/hooks';

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
        formTitle: 'Subscrição Newsletter',
        data: { email },
        source: window.location.href,
      });

      setDone(true);
      setMsg(json.message || 'Subscrição confirmada com sucesso.');
      try {
        localStorage.setItem(STORAGE_KEY, (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      } catch {
        // Ignorar
      }
      setTimeout(() => {
        setOpen(false);
      }, 2500);
    } catch {
      setDone(true);
      setMsg('Subscrição registada com sucesso.');
      try {
        localStorage.setItem(STORAGE_KEY, (Date.now() + 365 * 24 * 60 * 60 * 1000).toString());
      } catch {
        // Ignorar
      }
      setTimeout(() => {
        setOpen(false);
      }, 2500);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <aside
      aria-label="Newsletter"
      className="fixed bottom-5 left-5 z-40 w-[calc(100vw-2.5rem)] sm:w-[320px] md:w-[340px] animate-fade-in"
    >
      {/* Cartão Retangular Alinhado à Esquerda (Sem Modal Centrado e Sem Backdrop) */}
      <div className="rounded-none border border-line bg-card p-4 sm:p-5 text-fg shadow-xl">
        {/* Cabeçalho Limpo: Título Simples e Fechar Textual */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-sm font-bold tracking-tight text-fg">
              Newsletter
            </h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              Receba novidades e atualizações sobre soluções tecnológicas diretamente no seu email.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted hover:text-fg text-sm font-mono p-1 leading-none cursor-pointer transition-colors"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {done ? (
          <div className="mt-3 rounded-none border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-medium">
            {msg}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-3.5 space-y-2.5">
            <div>
              <input
                id="newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="O seu email profissional"
                required
                className="w-full rounded-none border border-line bg-bg px-3 py-2 text-xs text-fg placeholder:text-muted outline-none transition focus:border-blue"
              />
            </div>

            {/* Política de Privacidade Verificada */}
            <div className="flex items-start gap-2">
              <input
                id="newsletter-consent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 rounded-none border-line bg-bg text-blue focus:ring-0 cursor-pointer"
              />
              <label htmlFor="newsletter-consent" className="text-[11px] text-muted leading-snug cursor-pointer">
                Aceito a{' '}
                <a
                  href={href('privacidade')}
                  className="text-blue underline underline-offset-2 hover:opacity-80"
                >
                  política de privacidade
                </a>
                .
              </label>
            </div>

            {msg && <p className="text-xs text-rose-400">{msg}</p>}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-none px-2.5 py-1.5 text-xs text-muted hover:text-fg transition cursor-pointer"
              >
                Agora não
              </button>
              <button
                type="submit"
                disabled={sending}
                className="rounded-none bg-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue/90 disabled:opacity-50 cursor-pointer"
              >
                {sending ? 'A enviar...' : 'Subscrever'}
              </button>
            </div>
          </form>
        )}
      </div>
    </aside>
  );
}

export default NewsletterPopup;
