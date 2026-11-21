import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AdminIcon3D, AdminIcon3DName } from './AdminIcon3D';

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'dark' | 'light';
  sidebarMode?: 'inverted' | 'match' | 'dark' | 'light';
  userRole?: string;
  onLogout?: () => void;
}

const NAV_GROUPS: Array<{
  title: string;
  items: Array<{ id: string; label: string; icon3d: AdminIcon3DName; adminOnly?: boolean }>;
}> = [
  {
    title: 'Operação',
    items: [
      { id: 'dashboard', label: 'Visão Geral', icon3d: 'dashboard' },
      { id: 'calendar', label: 'Calendário', icon3d: 'calendar' },
      { id: 'tasks', label: 'Tarefas & Processos', icon3d: 'tasks' },
      { id: 'files', label: 'Arquivos Digitais', icon3d: 'folder' },
    ],
  },
  {
    title: 'Comunicação & Leads',
    items: [
      { id: 'crm', label: 'CRM & Contactos', icon3d: 'contacts' },
      { id: 'submissions', label: 'Formulários Portal', icon3d: 'inbox' },
      { id: 'support', label: 'Atendimento', icon3d: 'support' },
      { id: 'broadcast', label: 'Disparo em Massa', icon3d: 'send' },
      { id: 'internal_chat', label: 'Comunicação Interna', icon3d: 'chat' },
    ],
  },
  {
    title: 'Conteúdo do Website',
    items: [
      { id: 'products', label: 'Produtos', icon3d: 'channels' },
      { id: 'news', label: 'Notícias', icon3d: 'news' },
      { id: 'team', label: 'Equipa', icon3d: 'users' },
      { id: 'portfolio', label: 'Portfólio', icon3d: 'portfolio' },
    ],
  },
  {
    title: 'Sistema & Conta',
    items: [
      { id: 'settings', label: 'Definições & Canais', icon3d: 'settings', adminOnly: false },
    ],
  },
];

export function Sidebar({
  activeTab = 'dashboard',
  onSelectTab,
  collapsed = false,
  onToggleCollapse,
  theme = 'dark',
  sidebarMode = 'inverted',
  userRole = 'admin',
}: SidebarProps) {
  const isPanelDark = theme === 'dark';
  const sidebarDark =
    sidebarMode === 'dark'
      ? true
      : sidebarMode === 'light'
      ? false
      : sidebarMode === 'match'
      ? isPanelDark
      : !isPanelDark;
  const isLightSidebar = !sidebarDark;
  const isAdmin = userRole === 'admin' || userRole === 'Administrador Executivo';

  return (
    <aside
      className={`shrink-0 h-screen overflow-hidden border-r hidden md:flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-60'
      } ${
        isLightSidebar
          ? 'bg-white text-slate-900 border-slate-200'
          : 'bg-[#0B0F17] text-slate-100 border-white/10'
      }`}
    >
      {/* Marca + Toggle */}
      <div
        className={`h-14 px-4 flex items-center justify-between border-b ${
          isLightSidebar ? 'border-slate-200' : 'border-white/10'
        }`}
      >
        {!collapsed && (
          <button
            type="button"
            onClick={() => onSelectTab?.('dashboard')}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            <img
              src={isLightSidebar ? '/logo-mark.png' : '/logo-white.png'}
              alt="JOGIMIL"
              className="h-6 w-auto object-contain shrink-0"
            />
            <span
              className={`text-[11px] font-mono uppercase tracking-widest truncate ${
                isLightSidebar ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Admin
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          className={`inline-flex items-center justify-center rounded-lg h-8 w-8 transition-colors ${
            collapsed ? 'mx-auto' : ''
          } ${
            isLightSidebar
              ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navegação agrupada com ícones 3D */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p
                className={`px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  isLightSidebar ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab?.(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 rounded-full mx-2 px-3.5 h-9 text-[13px] font-medium transition-all duration-150 w-[calc(100%-1rem)] ${
                        collapsed ? 'justify-center px-0' : ''
                      } ${
                        isActive
                          ? isLightSidebar
                            ? 'bg-[#0066FF]/10 text-[#0066FF] font-semibold shadow-[inset_0_0_0_1px_rgba(0,102,255,0.22)]'
                            : 'bg-[#0066FF]/20 text-white font-semibold shadow-[inset_0_0_0_1px_rgba(56,189,248,0.35)]'
                          : isLightSidebar
                          ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                          : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <AdminIcon3D
                        name={item.icon3d}
                        size={20}
                        className={isActive ? 'opacity-100 scale-105' : 'opacity-85 group-hover:opacity-100'}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
