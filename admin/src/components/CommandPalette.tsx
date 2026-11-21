import { useEffect, useState } from 'react';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Mail,
  Users,
  Bell,
  Newspaper,
  Server,
  Plus,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
  onAction: (actionKey: string) => void;
  contacts?: Array<{ id: string; name: string; email: string; phone: string }>;
  onSelectContact?: (contact: any) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onAction,
  contacts = [],
  onSelectContact,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { id: 'dashboard', label: 'Painel Executivo & Métricas', icon: LayoutDashboard, group: 'Navegação' },
    { id: 'calendar', label: 'Calendário Corporativo & CalDAV', icon: Bell, group: 'Navegação' },
    { id: 'tasks', label: 'Gestão de Tarefas & Processos', icon: Users, group: 'Navegação' },
    { id: 'files', label: 'Biblioteca de Arquivos Digitais (PDF, Excel, Imagens)', icon: Server, group: 'Navegação' },
    { id: 'support', label: 'Central de Atendimento (WhatsApp & Email)', icon: MessageSquare, group: 'Navegação' },
    { id: 'broadcast', label: 'Disparo em Massa (WhatsApp, Email, SMS)', icon: Mail, group: 'Navegação' },
    { id: 'crm', label: 'CRM & Funil de Vendas com Gráficos', icon: Users, group: 'Navegação' },
    { id: 'news', label: 'Gestão de Notícias com Foto', icon: Newspaper, group: 'Navegação' },
    { id: 'team', label: 'Membros da Equipa JOGIMIL', icon: Users, group: 'Navegação' },
    { id: 'portfolio', label: 'Portfólio de Projetos & Mockups', icon: Server, group: 'Navegação' },
    { id: 'settings', label: 'Definições do Sistema (Evolution API & Email)', icon: Server, group: 'Navegação' },
  ];

  const actionItems = [
    { id: 'new_contact', label: 'Adicionar Novo Contacto / Lead', icon: Plus, group: 'Ações Rápidas' },
    { id: 'new_reminder', label: 'Agendar Novo Lembrete com WhatsApp', icon: Plus, group: 'Ações Rápidas' },
    { id: 'new_news', label: 'Criar Nova Notícia para o Portal', icon: Plus, group: 'Ações Rápidas' },
    { id: 'test_whatsapp', label: 'Disparo de Teste no WhatsApp', icon: MessageSquare, group: 'Ações Rápidas' },
    { id: 'test_email', label: 'Enviar Email de Teste SMTP', icon: Mail, group: 'Ações Rápidas' },
  ];

  const q = query.toLowerCase().trim();

  const filteredNav = navItems.filter((item) => item.label.toLowerCase().includes(q));
  const filteredActions = actionItems.filter((item) => item.label.toLowerCase().includes(q));
  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className="relative w-full max-w-xl overflow-hidden border ds-divider"
        style={{
          backgroundColor: 'rgb(var(--surface))',
          color: 'rgb(var(--text))',
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        {/* Input Bar */}
        <div className="flex items-center border-b ds-divider px-4 py-3.5">
          <Search className="h-4 w-4 text-brand shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um comando, contacto ou aba do sistema..."
            className="w-full bg-transparent text-sm placeholder:opacity-60 focus:outline-none"
            style={{ color: 'rgb(var(--text))' }}
          />
          <kbd className="hidden sm:inline-flex kbd">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {/* Navegação */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle">
                Navegação
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-[rgb(var(--surface-2))] transition group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-brand shrink-0" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 ds-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle">
                Ações Rápidas
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredActions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onAction(item.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-[rgb(var(--surface-2))] transition group text-left border border-transparent hover:border-[rgb(var(--border))]"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-5 w-5 items-center justify-center bg-brand/15 text-brand">
                          <Icon className="h-3 w-3" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-brand font-mono">Executar</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contactos Encontrados */}
          {filteredContacts.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ds-subtle">
                Contactos / Leads no CRM
              </p>
              <div className="mt-1 space-y-0.5">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => {
                      if (onSelectContact) onSelectContact(contact);
                      onNavigate('contacts');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium hover:bg-[rgb(var(--surface-2))] transition group text-left"
                  >
                    <div>
                      <p className="font-semibold">{contact.name}</p>
                      <p className="text-[11px] ds-muted">{contact.phone} · {contact.email}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 ds-subtle group-hover:text-brand" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && filteredContacts.length === 0 && (
            <div className="py-8 text-center text-sm ds-muted">
              Nenhum resultado encontrado para &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t ds-divider ds-surface-2 px-4 py-2 text-[11px] ds-muted">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ selecionar</span>
          </div>
          <span>JOGIMIL OS · Hub Omnicanal</span>
        </div>
      </div>
    </div>
  );
}