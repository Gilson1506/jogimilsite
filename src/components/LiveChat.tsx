import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '../data/content';
import { submitToMicroservice } from '../lib/api';
import { MascoteAgente } from './MascoteAgente';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const QUICK_SUGGESTIONS = [
  { id: 'orcamento', label: 'Pedir orçamento', query: 'Gostaria de solicitar um orçamento para desenvolvimento de software.' },
  { id: 'saft', label: 'Faturação SAF-T (AO)', query: 'Como funciona o software de faturação e POS certificado pela AGT?' },
  { id: 'ia', label: 'Agentes de IA & Automação', query: 'Quais são as soluções de inteligência artificial desenvolvidas pela JOGIMIL?' },
  { id: 'contacto', label: 'Contacto e localização', query: 'Onde fica a vossa sede em Luanda e qual o horário de atendimento?' },
];

function playNotificationSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Autoplay policy
  }
}

function getSmartReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes('orçamento') || t.includes('orcamento') || t.includes('preco') || t.includes('preço') || t.includes('custo') || t.includes('quanto custa')) {
    return 'Os nossos orçamentos são personalizados de acordo com os requisitos técnicos da sua empresa (Web, Mobile, POS/ERP ou IA). Se pretender uma proposta formal, pode indicar o seu nome e email ou telefone.';
  }
  if (t.includes('saft') || t.includes('saf-t') || t.includes('fatura') || t.includes('faturação') || t.includes('pos') || t.includes('agt')) {
    return 'O nosso software de faturação e POS cumpre 100% das normas fiscais da AGT para validação e extracção do SAF-T (AO). Funciona em nuvem e offline com postos de venda rápidos.';
  }
  if (t.includes('ia') || t.includes('inteligencia') || t.includes('inteligência') || t.includes('agente') || t.includes('automac') || t.includes('automação')) {
    return 'No modelo AI-First, desenvolvemos agentes autónomos e automação de fluxos corporativos integrados aos seus sistemas, garantindo total privacidade e conformidade de dados.';
  }
  if (t.includes('contacto') || t.includes('telefone') || t.includes('morada') || t.includes('onde fica') || t.includes('localizacao') || t.includes('localização') || t.includes('horario') || t.includes('horário')) {
    return `A nossa sede situa-se na Urbanização Nova Vida, Kilamba Kiaxi, Luanda. Estamos disponíveis pelo telefone ${COMPANY.phone} nos dias úteis das 08h às 17h.`;
  }
  if (t.includes('servico') || t.includes('serviço') || t.includes('web') || t.includes('app') || t.includes('mobile')) {
    return 'Construímos soluções completas: plataformas web responsivas, aplicações mobile nativas (iOS e Android), sistemas desktop de retalho e integrações com o sistema bancário angolano.';
  }
  return 'A equipa técnica da JOGIMIL em Luanda registou a sua mensagem e responderá em breve. Pode também indicar o seu email profissional se desejar retorno formal por escrito.';
}

export function LiveChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Seja bem-vindo à JOGIMIL Tecnologias em Luanda.\n\nComo podemos apoiar o seu projeto de software ou consultoria?',
      time: formatTime(new Date()),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (open && !minimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, open, minimized]);

  // Listener para abertura remota por outros componentes/botões
  useEffect(() => {
    const handleRemoteOpen = () => {
      handleOpen();
    };
    window.addEventListener('jogimil:open-chat', handleRemoteOpen);
    return () => window.removeEventListener('jogimil:open-chat', handleRemoteOpen);
  }, []);

  // Auto-resize do textarea moderno
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnreadCount(0);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userText = input.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    submitToMicroservice({
      formType: 'livechat_msg',
      formTitle: `Mensagem Chat: ${userText.slice(0, 32)}`,
      data: {
        mensagem: userText,
      },
      source: window.location.href,
    }).catch(() => {});

    setTimeout(() => {
      setIsTyping(false);
      const reply = getSmartReply(userText);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, botMsg]);
      playNotificationSound();

      if (!open || minimized) {
        setUnreadCount((prev) => prev + 1);
      }
    }, 650);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (query: string) => {
    setInput(query);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const resetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: 'Olá! Seja bem-vindo à JOGIMIL Tecnologias em Luanda.\n\nComo podemos apoiar o seu projeto de software ou consultoria?',
        time: formatTime(new Date()),
      },
    ]);
  };

  return (
    <>
      {/* 1. Mascote Robô Animado Flutuante a Acenar como Trigger Interativo do Live Chat */}
      <div
        className="fixed z-40 select-none bottom-4 right-3 sm:bottom-6 sm:right-6"
        style={{
          bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))',
        }}
      >
        <MascoteAgente
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              handleOpen();
            }
          }}
          isOpen={open}
          unreadCount={unreadCount}
        />
      </div>

      {/* 2. Card do Live Chat: 100% Responsivo em Mobile (Full-Screen nativo) e Retangular no Desktop */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Atendimento JOGIMIL"
          className={`fixed z-50 flex flex-col overflow-hidden bg-white text-slate-900 border-sky-300 shadow-2xl transition-all duration-200 ${
            minimized
              ? 'bottom-8 right-5 sm:bottom-8 sm:right-8 h-14 w-[calc(100vw-2.5rem)] sm:w-[360px] rounded-xl border border-sky-300 shadow-lg flex items-center justify-between px-4'
              : 'inset-0 sm:inset-auto sm:bottom-28 sm:right-8 sm:w-[385px] sm:h-[540px] sm:max-h-[calc(100dvh-9rem)] sm:rounded-none sm:border rounded-none'
          } shadow-[0_20px_60px_-15px_rgba(2,132,199,0.25)]`}
        >
          {/* Cabeçalho Refinado em Azul Claro & Branco com Logótipo Oficial */}
          <div
            className="flex items-center justify-between px-4 py-3 sm:py-3.5 select-none border-b border-sky-400/30 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-600 text-white shrink-0"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-none bg-white p-1 shadow-xs border border-white/40">
                <img src="/logo-mark.png" alt="JOGIMIL" className="h-full w-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-display font-bold tracking-tight leading-tight text-white">
                    JOGIMIL Tecnologias
                  </p>
                  <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold rounded-none bg-white/20 text-white border border-white/30">
                    AO
                  </span>
                </div>
                <p className="text-[11px] mt-0.5 text-sky-100">
                  Consultoria & Engenharia de Software · Luanda
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white">
              <button
                onClick={resetChat}
                title="Reiniciar conversa"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20 active:scale-95 text-xs"
                aria-label="Reiniciar conversa"
              >
                ↺
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20 active:scale-95"
                aria-label={minimized ? 'Expandir' : 'Minimizar'}
              >
                <span className="block h-0.5 w-3 bg-current" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/20 active:scale-95"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30">
              {/* Fluxo de Mensagens em Branco e Azul Claro */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs sm:text-sm overscroll-contain">
                <div className="flex justify-center">
                  <span className="px-3 py-0.5 font-mono text-[9px] rounded-full bg-sky-100 text-blue-900 border border-sky-200">
                    Atendimento Oficial · Luanda
                  </span>
                </div>

                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs sm:text-sm ${
                        m.sender === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white rounded-br-xs font-normal shadow-sm shadow-blue-500/20'
                          : 'bg-white text-slate-800 border border-sky-200/90 rounded-bl-xs shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className="mt-1 px-1 font-mono text-[9px] text-sky-700/70">
                      {m.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 w-fit bg-white text-sky-600 border border-sky-200 shadow-xs">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.18s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.36s]" />
                  </div>
                )}

                {/* Sugestões Rápidas em Pílulas em Azul Claro & Branco */}
                {messages.length <= 2 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-medium mb-2 text-sky-900">
                      Tópicos frequentes:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SUGGESTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSuggestion(s.query)}
                          className="rounded-full px-3.5 py-1.5 text-xs transition active:scale-98 font-medium bg-white hover:bg-sky-50 text-blue-900 border border-sky-200 shadow-2xs"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Modern Chat Composer em Azul Claro & Branco */}
              <div
                className="p-3 border-t border-sky-100 bg-white shrink-0"
                style={{
                  paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
                }}
              >
                <div
                  className={`relative flex flex-col rounded-xl border transition-all duration-200 ${
                    isFocused
                      ? 'border-sky-400 bg-white ring-2 ring-sky-100 shadow-xs'
                      : 'border-sky-200 bg-sky-50/30 hover:border-sky-300'
                  }`}
                >
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Escreva a sua mensagem..."
                    className="w-full resize-none bg-transparent px-3.5 pt-2.5 pb-1.5 text-xs sm:text-sm focus:outline-none max-h-[120px] leading-relaxed text-slate-900 placeholder-slate-400"
                  />

                  {/* Barra interna com botão em degradê azul */}
                  <div className="flex items-center justify-between px-2.5 pb-2 pt-1">
                    <span className="text-[10px] font-mono text-sky-700/70">
                      Luanda · JOGIMIL
                    </span>

                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-all ${
                        input.trim()
                          ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:opacity-95 active:scale-95 cursor-pointer shadow-xs shadow-blue-500/30'
                          : 'bg-sky-100 text-sky-400 cursor-not-allowed'
                      }`}
                      aria-label="Enviar mensagem"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
