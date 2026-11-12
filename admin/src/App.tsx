import { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardMetrics } from './components/DashboardMetrics';
import { PerformanceChart } from './components/PerformanceChart';
import { TickerList } from './components/TickerList';
import { SupportCenter } from './components/SupportCenter';
import { MassBroadcast } from './components/MassBroadcast';
import { AdvancedCrm } from './components/AdvancedCrm';
import { NewsManager } from './components/NewsManager';
import { TeamManager } from './components/TeamManager';
import { PortfolioManager } from './components/PortfolioManager';
import { SettingsManager } from './components/SettingsManager';
import { AdminLogin } from './components/AdminLogin';
import { CosmicBackground } from './components/CosmicBackground';
import { CommandPalette } from './components/CommandPalette';

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Default to authenticated for instant executive dashboard review, supports full logout
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = sessionStorage.getItem('jogimil_admin_session');
      return session !== 'false';
    } catch {
      return true;
    }
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const stored = sessionStorage.getItem('jogimil_admin_user');
      return stored
        ? JSON.parse(stored)
        : {
            name: 'Joel Gaspar',
            email: 'admin@jogimiltecnologias.it.ao',
            role: 'Administrador Executivo',
          };
    } catch {
      return {
        name: 'Joel Gaspar',
        email: 'admin@jogimiltecnologias.it.ao',
        role: 'Administrador Executivo',
      };
    }
  });

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  const isDark = theme === 'dark';

  // If not logged in, render the secure admin login screen
  if (!isAuthenticated) {
    return <AdminLogin theme={theme} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      className={`relative h-screen w-full font-sans overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Dynamic Animated Cosmic Particle Canvas in Background */}
      {isDark && <CosmicBackground />}

      {/* Top Header with Logo, Command Palette trigger, Notifications & Profile */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenTab={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
      />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onAction={(action) => {
          if (action === 'new_contact') setActiveTab('crm');
          else if (action === 'new_news') setActiveTab('news');
          else if (action === 'test_whatsapp') setActiveTab('support');
          else if (action === 'test_email') setActiveTab('settings');
        }}
      />

      {/* Main Scrollable Area matching finbro-dashboard exact layout */}
      <div className="h-full overflow-y-auto no-scrollbar relative z-10">
        <main className="flex gap-6 p-6 pt-24 min-h-full max-w-[1780px] mx-auto">
          {/* Collapsible Executive Sidebar */}
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            theme={theme}
            onLogout={handleLogout}
          />

          {/* Main Content Container */}
          <div className="flex-1 flex flex-col gap-6 min-w-0 pb-12">
            {/* TAB: DASHBOARD (EXATAMENTE COMO O FINBRO DASHBOARD) */}
            {activeTab === 'dashboard' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <DashboardMetrics theme={theme} />
                <PerformanceChart theme={theme} />
                <TickerList theme={theme} />
              </div>
            )}

            {/* TAB: ATENDIMENTO MULTICANAL (WHATSAPP & EMAIL) */}
            {activeTab === 'support' && <SupportCenter theme={theme} />}

            {/* TAB: DISPARO EM MASSA (WHATSAPP, EMAIL & SMS) */}
            {activeTab === 'broadcast' && <MassBroadcast theme={theme} />}

            {/* TAB: CRM AVANÇADO & FUNIL DE VENDAS COM GRÁFICOS */}
            {activeTab === 'crm' && <AdvancedCrm theme={theme} />}

            {/* TAB: GESTÃO DE NOTÍCIAS COM FOTO */}
            {activeTab === 'news' && <NewsManager theme={theme} />}

            {/* TAB: MEMBROS DA EQUIPA COM FOTO */}
            {activeTab === 'team' && <TeamManager theme={theme} />}

            {/* TAB: PORTFÓLIO DE PROJETOS COM IMAGENS */}
            {activeTab === 'portfolio' && <PortfolioManager theme={theme} />}

            {/* TAB: DEFINIÇÕES (EVOLUTION API & SMTP/IMAP MICROSERVIÇO) */}
            {activeTab === 'settings' && <SettingsManager theme={theme} />}

            {/* Status Indicator (Exatamente no canto inferior direito conforme finbro-dashboard) */}
            <div className="flex items-center justify-end gap-2 mt-4 pr-1">
              <div className="w-[13px] h-[13px] rounded-full bg-[#86efac] animate-pulse" />
              <span className="text-sm text-[#919191]">
                Status: All Systems Operational · JOGIMIL Cloud Luanda
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
