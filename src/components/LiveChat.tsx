import { useEffect, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
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
  const [channelPickerOpen, setChannelPickerOpen] = useState(false);
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
      {/* 1. Mascote 3D Original Flutuante + Seletor de Canal (WhatsApp ou Chat) */}
      <div
        className="fixed z-40 select-none bottom-4 right-3 sm:bottom-6 sm:right-6 flex flex-col items-center gap-3"
        style={{
          bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))',
          right: 'max(1rem, calc(env(safe-area-inset-right, 0px) + 0.75rem))',
        }}
      >
        {/* 2 Ícones 3D (Branco & Azul) ao clicar na Mascote 3D */}
        {channelPickerOpen && !open && (
          <div className="flex flex-col items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
            {/* Canal 1: WhatsApp 3D Branco & Azul */}
            <a
              href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(
                'Olá JOGIMIL Tecnologias! Gostaria de iniciar uma conversa.'
              )}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setChannelPickerOpen(false)}
              aria-label="Iniciar conversa no WhatsApp"
              className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-white via-sky-50 to-sky-100 text-[#0066FF] border border-sky-400/60 shadow-[0_5px_0_#0052cc,0_14px_28px_-6px_rgba(0,102,255,0.55),inset_0_2px_4px_rgba(255,255,255,1)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:translate-y-0.5"
            >
              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-white border border-sky-300 px-3 py-1 text-xs font-semibold text-slate-900 shadow-[0_8px_20px_-6px_rgba(0,102,255,0.35)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                WhatsApp
              </span>
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current drop-shadow-[0_2px_4px_rgba(0,102,255,0.28)]" aria-hidden="true">
                <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.6 5.95L0 24l6.33-1.66a11.85 11.85 0 0 0 5.72 1.46h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.43-8.42ZM12.06 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.22-3.76.99 1-3.66-.24-.38a9.86 9.86 0 0 1-1.51-5.25c0-5.46 4.44-9.9 9.91-9.9 2.65 0 5.14 1.03 7.01 2.9a9.84 9.84 0 0 1 2.9 7.01c0 5.46-4.44 9.89-9.9 9.89Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z" />
              </svg>
            </a>

            {/* Canal 2: Chat ao Vivo 3D Azul & Branco */}
            <button
              type="button"
              onClick={() => {
                setChannelPickerOpen(false);
                handleOpen();
              }}
              aria-label="Abrir Chat ao Vivo"
              className="group relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-400 via-[#0066FF] to-[#0052cc] text-white border border-white/40 shadow-[0_5px_0_#003d99,0_14px_28px_-6px_rgba(0,102,255,0.6),inset_0_2px_4px_rgba(255,255,255,0.65)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 active:translate-y-0.5"
            >
              <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-white border border-sky-300 px-3 py-1 text-xs font-semibold text-slate-900 shadow-[0_8px_20px_-6px_rgba(0,102,255,0.35)] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                Chat ao Vivo
              </span>
              <MessageSquare className="h-6 w-6 drop-shadow-[0_2px_4px_rgba(0,0,0,0.28)]" />
            </button>
          </div>
        )}

        <MascoteAgente
          onClick={() => {
            if (open) {
              setOpen(false);
              setChannelPickerOpen(false);
            } else {
              setChannelPickerOpen((prev) => !prev);
            }
          }}
          isOpen={open || channelPickerOpen}
          unreadCount={unreadCount}
        />
      </div>

      {/* 2. Card do Live Chat 3D Branco & Azul de Alta Nitidez */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Atendimento JOGIMIL"
          className={`fixed z-50 flex flex-col overflow-hidden bg-white text-slate-900 border-2 border-sky-500/45 ring-1 ring-white/90 transition-all duration-200 ${
            minimized
              ? 'bottom-8 right-5 sm:bottom-8 sm:right-8 h-14 w-[calc(100vw-2.5rem)] sm:w-[360px] rounded-2xl shadow-[0_18px_42px_-12px_rgba(0,102,255,0.45),0_4px_0_rgba(0,102,255,0.25)] flex items-center justify-between px-4'
              : 'inset-0 sm:inset-auto sm:bottom-28 sm:right-8 sm:w-[395px] sm:h-[550px] sm:max-h-[calc(100dvh-9rem)] sm:rounded-2xl rounded-none shadow-[0_28px_72px_-14px_rgba(0,102,255,0.45),0_10px_28px_-10px_rgba(15,23,42,0.3),0_5px_0_rgba(0,102,255,0.22)]'
          }`}
        >
          {/* Cabeçalho 3D em Azul & Branco de Alto Contraste */}
          <div
            className="flex items-center justify-between px-4 py-3.5 select-none border-b border-sky-400/40 bg-gradient-to-r from-[#0052cc] via-[#0066FF] to-sky-500 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] shrink-0"
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,1)] border border-white/80">
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
            <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-sky-50/40">
              {/* Fluxo de Mensagens Nítido em Branco e Azul */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-xs sm:text-sm overscroll-contain">
                <div className="flex justify-center">
                  <span className="px-3 py-0.5 font-mono text-[10px] font-semibold rounded-full bg-white text-sky-800 border border-sky-200 shadow-xs">
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
                          ? 'bg-gradient-to-br from-[#0066FF] to-sky-500 text-white rounded-br-xs font-normal shadow-[0_6px_16px_-4px_rgba(0,102,255,0.45)]'
                          : 'bg-white text-slate-900 border border-sky-200 rounded-bl-xs shadow-[0_4px_14px_-4px_rgba(0,102,255,0.18)]'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    <span className="mt-1 px-1 font-mono text-[9px] text-sky-800/70">
                      {m.time}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 w-fit bg-white text-[#0066FF] border border-sky-200 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.18s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.36s]" />
                  </div>
                )}

                {/* Sugestões Rápidas em Pílulas em Branco & Azul */}
                {messages.length <= 2 && (
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold mb-2 text-slate-900">
                      Tópicos frequentes:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SUGGESTIONS.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handleSuggestion(s.query)}
                          className="rounded-full px-3.5 py-1.5 text-xs transition active:scale-98 font-semibold bg-white hover:bg-[#0066FF] hover:text-white text-[#0052cc] border border-sky-300 shadow-xs"
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Modern Chat Composer em Branco & Azul */}
              <div
                className="p-3 border-t border-sky-100 bg-white shrink-0"
                style={{
                  paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
                }}
              >
                <div
                  className={`relative flex flex-col rounded-xl border-2 transition-all duration-200 ${
                    isFocused
                      ? 'border-[#0066FF] bg-white ring-2 ring-sky-100 shadow-sm'
                      : 'border-sky-200 bg-sky-50/40 hover:border-sky-300'
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
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all ${
                        input.trim()
                          ? 'bg-gradient-to-r from-[#0066FF] to-sky-500 text-white hover:opacity-95 active:scale-95 cursor-pointer shadow-[0_4px_12px_-2px_rgba(0,102,255,0.5)]'
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
