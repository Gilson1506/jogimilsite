import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { PerformanceChart } from './components/PerformanceChart';
import { VisitAnalyticsPanel } from './components/VisitAnalyticsPanel';
import { TickerList } from './components/TickerList';
import { SupportCenter } from './components/SupportCenter';
import { PortalSubmissionsPanel } from './components/PortalSubmissionsPanel';
import { MassBroadcast } from './components/MassBroadcast';
import { CrmContacts } from './components/CrmContacts';
import { NewsManager } from './components/NewsManager';
import { ProductsManager } from './components/ProductsManager';
import { TeamManager } from './components/TeamManager';
import { PortfolioManager } from './components/PortfolioManager';
import { SettingsManager } from './components/SettingsManager';
import { CalendarManager } from './components/CalendarManager';
import { TasksProcessesManager } from './components/TasksProcessesManager';
import { DigitalFilesManager } from './components/DigitalFilesManager';
import { ProfileManager } from './components/ProfileManager';
import { UsersManager } from './components/UsersManager';
import { InternalChat } from './components/InternalChat';
import { AdminLogin } from './components/AdminLogin';
import { CommandPalette } from './components/CommandPalette';
import { apiFetch, getSessionUser, type SessionUser } from './lib/api';

type AdminUser = SessionUser;
export type SidebarThemeMode = 'inverted' | 'match' | 'dark' | 'light';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('jogimil_admin_theme') === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [sidebarMode, setSidebarMode] = useState<SidebarThemeMode>(() => {
    try {
      const saved = localStorage.getItem('jogimil_admin_sidebar_mode');
      if (saved === 'inverted' || saved === 'match' || saved === 'dark' || saved === 'light') {
        return saved;
      }
      return 'inverted';
    } catch {
      return 'inverted';
    }
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('jogimil_admin_sidebar_mode', sidebarMode);
    } catch {
      // ignore
    }
  }, [sidebarMode]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatPeerId, setChatPeerId] = useState<string | null>(null);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light');
    document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light');
    try {
      localStorage.setItem('jogimil_admin_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('jogimil_admin_session') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    return (
      getSessionUser() || {
        id: 'usr_admin_root',
        name: 'Joel Gaspar',
        email: 'admin@jogimiltecnologias.it.ao',
        role: 'admin',
        jobTitle: 'Administrador Executivo',
        whatsapp: '244942775559',
      }
    );
  });

  // Carregar perfil atualizado do servidor (nome, email e foto avatarUrl) ao autenticar
  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    apiFetch<{ profile?: AdminUser; user?: AdminUser }>('/api/v1/admin/profile')
      .then((res) => {
        if (!active) return;
        const fresh = res.profile || res.user;
        if (fresh && (fresh.name || fresh.email)) {
          setCurrentUser((prev) => {
            const merged = { ...(prev || {}), ...fresh } as AdminUser;
            try {
              sessionStorage.setItem('jogimil_admin_user', JSON.stringify(merged));
            } catch {
              // ignore quota
            }
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Heartbeat de presença online em tempo real (envia aba ativa para monitorização do Admin)
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;
    const ping = () => {
      apiFetch('/api/v1/admin/users/heartbeat', {
        method: 'POST',
        body: JSON.stringify({ activeTab }),
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 15000);
    return () => clearInterval(id);
  }, [isAuthenticated, currentUser?.id, activeTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLoginSuccess = (user: AdminUser) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    try {
      sessionStorage.setItem('jogimil_admin_session', 'true');
      sessionStorage.setItem('jogimil_admin_user', JSON.stringify(user));
    } catch {
      // ok
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    try {
      sessionStorage.setItem('jogimil_admin_session', 'false');
      sessionStorage.removeItem('jogimil_admin_user');
    } catch {
      // ok
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLogin
        theme={theme}
        onSetTheme={(t) => setTheme(t)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div
      className={`fixed inset-0 flex overflow-hidden font-sans app-bg ${
        theme === 'dark' ? 'theme-dark' : 'theme-light'
      }`}
    >
      {/* Sidebar Enterprise Independente (nunca rola com a página) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        theme={theme}
        sidebarMode={sidebarMode}
        userRole={currentUser?.role}
        onLogout={handleLogout}
      />

      {/* Área Direita: Header fixo + Conteúdo com scroll independente */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          theme={theme}
          activeTab={activeTab}
          userName={currentUser?.name}
          userEmail={currentUser?.email}
          userRole={currentUser?.role}
          userAvatar={currentUser?.avatarUrl}
          onSetTheme={(t) => setTheme(t)}
          onOpenTab={(tab) => setActiveTab(tab)}
          onOpenInternalChat={(peerId) => {
            setChatPeerId(peerId || null);
            setActiveTab('internal_chat');
          }}
          onLogout={handleLogout}
        />

        <CommandPalette
          isOpen={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
          onAction={(action) => {
            if (action === 'new_contact') setActiveTab('crm');
            else if (action === 'new_news') setActiveTab('news');
            else if (action === 'test_whatsapp') setActiveTab('settings');
            else if (action === 'test_email') setActiveTab('settings');
          }}
        />

        <main className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-8">
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <DashboardMetrics theme={theme} />
                <PerformanceChart theme={theme} />
                <VisitAnalyticsPanel theme={theme} />
                <TickerList theme={theme} />
              </div>
            )}

            {activeTab === 'calendar' && <CalendarManager onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'tasks' && <TasksProcessesManager onNavigate={(tab) => setActiveTab(tab)} />}
            {activeTab === 'files' && <DigitalFilesManager />}
            {activeTab === 'crm' && <CrmContacts theme={theme} />}
            {activeTab === 'submissions' && <PortalSubmissionsPanel theme={theme} />}
            {activeTab === 'support' && <SupportCenter theme={theme} />}
            {activeTab === 'broadcast' && <MassBroadcast theme={theme} />}
            {activeTab === 'internal_chat' && (
              <InternalChat
                initialPeerId={chatPeerId}
                onClearInitialPeer={() => setChatPeerId(null)}
              />
            )}
            {activeTab === 'products' && <ProductsManager theme={theme} />}
            {activeTab === 'news' && <NewsManager theme={theme} />}
            {activeTab === 'team' && <TeamManager theme={theme} />}
            {activeTab === 'portfolio' && <PortfolioManager theme={theme} />}
            {activeTab === 'profile' && (
              <ProfileManager
                onProfileUpdated={(updated) => {
                  setCurrentUser(updated);
                  try {
                    sessionStorage.setItem('jogimil_admin_user', JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                }}
              />
            )}
            {activeTab === 'users' && currentUser?.role === 'admin' && <UsersManager />}
            {activeTab === 'settings' && (
              <SettingsManager
                theme={theme}
                onSetTheme={(t) => setTheme(t)}
                sidebarMode={sidebarMode}
                onChangeSidebarMode={(m) => setSidebarMode(m)}
                sidebarCollapsed={collapsed}
                onToggleSidebarCollapsed={() => setCollapsed((c) => !c)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
