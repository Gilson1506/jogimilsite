import {
  Blocks,
  Headphones,
  Newspaper,
  Users2,
  Briefcase,
  Contact2,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Send,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'dark' | 'light';
  onLogout?: () => void;
}

export function Sidebar({
  activeTab = 'dashboard',
  onSelectTab,
  collapsed = false,
  onToggleCollapse,
  theme = 'dark',
  onLogout,
}: SidebarProps) {
  const isDark = theme === 'dark';

  const navItems = [
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      sublabel: 'Visão Geral & Gráficos',
      icon: Blocks,
      badge: null,
    },
    {
      id: 'support',
      label: 'ATENDIMENTO',
      sublabel: 'WhatsApp & Email',
      icon: Headphones,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      id: 'broadcast',
      label: 'DISPARO EM MASSA',
      sublabel: 'WhatsApp, Email & SMS',
      icon: Send,
      badge: 'SMS/WA',
      badgeColor: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    },
    {
      id: 'crm',
      label: 'CRM & VENDAS',
      sublabel: 'Funil, Gráficos & Negócios',
      icon: Contact2,
      badge: 'Kz',
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'news',
      label: 'NOTÍCIAS',
      sublabel: 'Publicação com Foto',
      icon: Newspaper,
      badge: null,
    },
    {
      id: 'team',
      label: 'EQUIPA',
      sublabel: 'Membros & Perfis',
      icon: Users2,
      badge: null,
    },
    {
      id: 'portfolio',
      label: 'PORTFÓLIO',
      sublabel: 'Projetos & Mockups',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'settings',
      label: 'DEFINIÇÕES',
      sublabel: 'Evolution API & Email',
      icon: Settings2,
      badge: null,
    },
  ];

  return (
    <aside
      className={`sticky top-24 h-[calc(100vh-8rem)] transition-all duration-300 ease-in-out hidden md:flex flex-col p-4 rounded-2xl border ${
        collapsed ? 'w-20' : 'w-64'
      } ${
        isDark
          ? 'bg-[#090D16]/95 border-[#1E293B] text-slate-200 shadow-2xl shadow-blue-950/20 backdrop-blur-xl'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-xl shadow-slate-200/50 backdrop-blur-xl'
      }`}
    >
      {/* Minifier / Collapse Toggle Header */}
      <div className="flex items-center justify-between pb-4 mb-2 border-b border-inherit">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            <span className="text-[11px] font-bold tracking-wider uppercase text-blue-500">
              Menu Executivo
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir Sidebar' : 'Minimizar Sidebar'}
          className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
            collapsed ? 'mx-auto' : ''
          } ${
            isDark
              ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
          }`}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5 text-blue-500" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab && onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full group flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-left relative ${
                isActive
                  ? isDark
                    ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-600/30'
                    : 'bg-[#0066FF] text-white shadow-md shadow-blue-500/20'
                  : isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                  collapsed ? 'mx-auto' : ''
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive
                      ? 'text-white'
                      : isDark
                      ? 'text-slate-400 group-hover:text-blue-400'
                      : 'text-slate-500 group-hover:text-[#0066FF]'
                  }`}
                />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate ${
                      isActive
                        ? 'text-blue-100'
                        : isDark
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {item.sublabel}
                  </p>
                </div>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <div
                  className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${
                    collapsed ? 'bg-white' : 'hidden'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / External Links */}
      <div className="mt-auto pt-4 border-t border-inherit flex flex-col gap-2">
        <a
          href="https://jogimiltecnologias.it.ao"
          target="_blank"
          rel="noreferrer"
          title={collapsed ? 'Portal JOGIMIL' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors ${
            collapsed ? 'justify-center' : ''
          } ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ExternalLink className="h-4 w-4 text-blue-500" />
          {!collapsed && <span className="font-medium truncate">Portal JOGIMIL</span>}
        </a>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Terminar Sessão' : undefined}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
              collapsed ? 'justify-center' : ''
            } ${
              isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
            }`}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="font-medium truncate">Terminar Sessão</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
