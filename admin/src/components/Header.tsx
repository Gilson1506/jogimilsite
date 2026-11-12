import { useState } from 'react';
import { Settings2, LogOut, HelpCircle, Bell, Sun, Moon, Check, X, Search } from 'lucide-react';

interface HeaderProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenTab?: (tab: string) => void;
  onLogout?: () => void;
  onOpenCommandPalette?: () => void;
}

export function Header({
  theme = 'dark',
  onToggleTheme,
  onOpenTab,
  onLogout,
  onOpenCommandPalette,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    {
      id: 'notif_1',
      title: 'Nova mensagem no WhatsApp',
      desc: 'Carlos Mendonça enviou dúvida sobre POS SAF-T.',
      time: 'Há 5 min',
      unread: true,
      channel: 'whatsapp',
    },
    {
      id: 'notif_2',
      title: 'Email de Proposta Recebido',
      desc: 'Dra. Luísa solicitou orçamento para o Colégio.',
      time: 'Há 25 min',
      unread: true,
      channel: 'email',
    },
    {
      id: 'notif_3',
      title: 'Lembrete de Follow-up',
      desc: 'Follow-up de proposta comercial agendado para hoje.',
      time: 'Há 1 hora',
      unread: false,
      channel: 'system',
    },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const isDark = theme === 'dark';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b transition-colors duration-200 ${
        isDark
          ? 'bg-black/40 backdrop-blur-[120px] border-[#1F1F1F]'
          : 'bg-white/70 backdrop-blur-[120px] border-slate-200 shadow-xs'
      }`}
    >
      {/* JOGIMIL Logo Oficial em PNG */}
      <div className="flex items-center gap-3">
        <img
          src={isDark ? '/logo-white.png' : '/logo-mark.png'}
          alt="JOGIMIL"
          className="h-8 w-auto object-contain cursor-pointer transition-opacity hover:opacity-90"
        />
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs font-mono">
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
            JOGIMIL OS · Suite
          </span>
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Luanda (AO)</span>
        </div>
      </div>

      {/* Command Palette Trigger (⌘K) */}
      <button
        onClick={onOpenCommandPalette}
        className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
          isDark
            ? 'bg-[#141414]/90 border-[#262626] text-slate-400 hover:text-white hover:border-blue-500/50'
            : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
        }`}
      >
        <Search className="h-3.5 w-3.5 text-blue-500" />
        <span>Pesquisar no sistema...</span>
        <kbd className="ml-4 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">⌘K</kbd>
      </button>

      {/* Ferramentas do Header: Modo Claro/Escuro, Notificações e Perfil */}
      <div className="flex items-center gap-3">
        {/* Alternador de Modo Claro e Noite */}
        <button
          onClick={onToggleTheme}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
            isDark
              ? 'bg-[#141414] border-[#262626] text-amber-400 hover:bg-[#1F1F1F]'
              : 'bg-slate-100 border-slate-300 text-blue-600 hover:bg-slate-200'
          }`}
          title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Noite'}
          aria-label="Alternar tema"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Ícone de Notificações com Badge e Drawer */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative h-9 w-9 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
              isDark
                ? 'bg-[#141414] border-[#262626] text-slate-300 hover:text-white hover:bg-[#1F1F1F]'
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Notificações do Sistema"
            aria-label="Abrir notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Painel Dropdown de Notificações */}
          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
              <div
                className={`absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-2xl border p-4 shadow-2xl transition-all ${
                  isDark
                    ? 'bg-[#0D0D0D] border-[#1F1F1F] text-white'
                    : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-blue-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wide">Notificações em Tempo Real</h4>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-blue-500 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Lidas
                    </button>
                  )}
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start justify-between gap-3 p-2.5 rounded-xl transition ${
                        n.unread
                          ? isDark
                            ? 'bg-[#161B2E] border border-blue-500/30'
                            : 'bg-blue-50 border border-blue-200'
                          : isDark
                          ? 'bg-[#141414] border border-transparent'
                          : 'bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold">{n.title}</p>
                          {n.unread && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {n.desc}
                        </p>
                        <span className={`text-[10px] font-mono mt-1 block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {n.time}
                        </span>
                      </div>
                      <button
                        onClick={() => removeNotification(n.id)}
                        className={`text-slate-400 hover:text-rose-400 p-1 cursor-pointer transition`}
                        title="Remover notificação"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <p className="text-center py-6 text-xs text-slate-500">
                      Não existem novas notificações.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar e Menu Dropdown de Perfil */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 via-sky-500 to-blue-700 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500/40 flex items-center justify-center font-bold text-xs text-white shadow-md shadow-blue-500/20 cursor-pointer"
            aria-label="Menu de utilizador"
          >
            JG
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className={`absolute right-0 mt-2 z-50 w-56 rounded-2xl border p-1.5 shadow-2xl transition-all ${
                  isDark
                    ? 'bg-[#0D0D0D] border-[#1F1F1F] text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-semibold">Engenharia JOGIMIL</p>
                  <p className={`text-[11px] font-mono truncate ${isDark ? 'text-[#919191]' : 'text-slate-500'}`}>
                    geral@jogimiltecnologias.it.ao
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenTab) onOpenTab('settings');
                  }}
                  className={`w-full flex items-center px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-slate-300 hover:text-white hover:bg-[#1F1F1F]' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Settings2 className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Definições do Sistema</span>
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onOpenTab) onOpenTab('support');
                  }}
                  className={`w-full flex items-center px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                    isDark ? 'text-slate-300 hover:text-white hover:bg-[#1F1F1F]' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <HelpCircle className="mr-2 h-4 w-4 text-sky-400" />
                  <span>Central de Atendimento</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full flex items-center px-3 py-2 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Terminar Sessão</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}