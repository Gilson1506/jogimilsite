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
    { id: 'dashboard', label: 'Painel Executivo', icon: LayoutDashboard, group: 'Navegação' },
    { id: 'whatsapp', label: 'WhatsApp Evolution API', icon: MessageSquare, group: 'Navegação' },
    { id: 'contacts', label: 'CRM & Contactos Omnicanal', icon: Users, group: 'Navegação' },
    { id: 'email', label: 'Central de Email IMAP/SMTP', icon: Mail, group: 'Navegação' },
    { id: 'reminders', label: 'Lembretes & Disparos', icon: Bell, group: 'Navegação' },
    { id: 'news', label: 'Gestão de Notícias', icon: Newspaper, group: 'Navegação' },
    { id: 'system', label: 'Infraestrutura & Microserviços', icon: Server, group: 'Navegação' },
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
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#0B1224] shadow-2xl shadow-blue/20">
        <div className="flex items-center border-b border-white/10 px-4 py-3.5">
          <Search className="h-5 w-5 text-sky-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um comando, contacto ou aba do sistema..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition group text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <span>{item.label}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                      className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-blue-600/20 hover:text-white transition group text-left border border-transparent hover:border-blue-500/30"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600/30 text-sky-300">
                          <Icon className="h-3 w-3" />
                        </div>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-sky-400 font-mono">Executar</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredContacts.length > 0 && (
            <div>
              <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                    className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 hover:text-white transition group text-left"
                  >
                    <div>
                      <p className="font-semibold text-white">{contact.name}</p>
                      <p className="text-[11px] text-slate-400">{contact.phone} · {contact.email}</p>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-500 group-hover:text-sky-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && filteredContacts.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              Nenhum resultado encontrado para &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 bg-black/30 px-4 py-2 text-[11px] text-slate-400">
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