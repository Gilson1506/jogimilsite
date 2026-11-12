import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Mail,
  Send,
  Paperclip,
  CheckCheck,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

interface SupportMessage {
  id: string;
  sender: 'customer' | 'agent' | 'bot';
  senderName: string;
  channel: 'whatsapp' | 'email';
  content: string;
  timestamp: string;
  delivered?: boolean;
  read?: boolean;
  subject?: string;
}

interface SupportTicket {
  id: string;
  customerName: string;
  contact: string;
  channel: 'whatsapp' | 'email';
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  subject: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount?: number;
  messages: SupportMessage[];
}

interface SupportCenterProps {
  theme?: 'dark' | 'light';
}

export function SupportCenter({ theme = 'dark' }: SupportCenterProps) {
  const isDark = theme === 'dark';

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [activeChannelMode, setActiveChannelMode] = useState<'whatsapp' | 'email'>('whatsapp');
  const [filterChannel, setFilterChannel] = useState<'all' | 'whatsapp' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Load support tickets from backend microservice
  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/support');
      if (res.ok) {
        const json = await res.json();
        const rawList = json.data || json.tickets || [];
        if (rawList.length > 0) {
          const normalized: SupportTicket[] = rawList.map((t: any) => ({
            id: t.id,
            customerName: t.customerName || t.contactName || 'Cliente JOGIMIL',
            contact: t.contact || t.phone || t.email || '+244 942 775 559',
            channel: t.channel || 'whatsapp',
            status: t.status || 'open',
            priority: t.priority || 'medium',
            subject: t.subject || 'Atendimento Omnicanal',
            lastMessage:
              t.lastMessage ||
              (t.messages && t.messages.length > 0
                ? t.messages[t.messages.length - 1].content
                : 'Solicitação em análise.'),
            updatedAt: t.updatedAt
              ? new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Hoje',
            unreadCount: t.unreadCount || 0,
            messages: (t.messages || []).map((m: any) => ({
              id: m.id,
              sender: m.sender === 'client' || m.sender === 'customer' ? 'customer' : 'agent',
              senderName:
                m.senderName ||
                (m.sender === 'client' || m.sender === 'customer'
                  ? t.customerName || t.contactName || 'Cliente'
                  : 'Suporte JOGIMIL'),
              channel: m.channel || t.channel || 'whatsapp',
              content: m.content,
              timestamp: m.timestamp
                ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Agora',
              delivered: m.delivered !== false,
              read: m.read !== false,
              subject: m.subject,
            })),
          }));

          setTickets(normalized);
          if (!selectedTicketId) {
            setSelectedTicketId(normalized[0].id);
            setActiveChannelMode(normalized[0].channel);
            setEmailSubject(`Re: ${normalized[0].subject}`);
          }
        }
      }
    } catch (err) {
      console.warn('Backend support offline, using fallback mock tickets:', err);
      // Fallback mock initial data
      const mock: SupportTicket[] = [
        {
          id: 'tick_1',
          customerName: 'Manuel Quaresma',
          contact: '+244 923 881 229',
          channel: 'whatsapp',
          status: 'open',
          priority: 'high',
          subject: 'Dúvida sobre integração do POS SAF-T Angola',
          lastMessage: 'Bom dia equipa JOGIMIL, gostaríamos de ativar a licença em 3 caixas em Luanda.',
          updatedAt: '10:45',
          unreadCount: 1,
          messages: [
            {
              id: 'm1',
              sender: 'customer',
              senderName: 'Manuel Quaresma',
              channel: 'whatsapp',
              content: 'Olá! Sou diretor de operações do Supermercado Alvalade. Preciso de suporte para a homologação da AGT no POS.',
              timestamp: '10:42',
            },
            {
              id: 'm2',
              sender: 'agent',
              senderName: 'Suporte JOGIMIL',
              channel: 'whatsapp',
              content: 'Bom dia Manuel! Estamos prontos para ajudar. O nosso módulo SAF-T (AO) 2026 já exporta o ficheiro XML validado.',
              timestamp: '10:44',
              delivered: true,
              read: true,
            },
            {
              id: 'm3',
              sender: 'customer',
              senderName: 'Manuel Quaresma',
              channel: 'whatsapp',
              content: 'Excelente! Gostaríamos de ativar a licença em 3 caixas em Luanda ainda esta semana.',
              timestamp: '10:45',
            },
          ],
        },
        {
          id: 'tick_2',
          customerName: 'Dra. Luísa Furtado',
          contact: 'luisa.furtado@colegiomilenio.ao',
          channel: 'email',
          status: 'in_progress',
          priority: 'medium',
          subject: 'Proposta Comercial - Sistema de Gestão Escolar e Portal do Aluno',
          lastMessage: 'Agradeço o envio da minuta técnica com o cronograma de implementação.',
          updatedAt: '09:20',
          unreadCount: 0,
          messages: [
            {
              id: 'm201',
              sender: 'customer',
              senderName: 'Dra. Luísa Furtado',
              channel: 'email',
              subject: 'Proposta Comercial - Sistema de Gestão Escolar e Portal do Aluno',
              content: 'Exmos. Senhores da JOGIMIL Tecnologias,\n\nVimos por este meio solicitar proposta orçamental detalhada para a informatização completa do Colégio Milénio, incluindo portal de propinas e portal dos encarregados de educação.',
              timestamp: '08:50',
            },
            {
              id: 'm202',
              sender: 'agent',
              senderName: 'Direção Comercial JOGIMIL',
              channel: 'email',
              subject: 'Re: Proposta Comercial - Sistema de Gestão Escolar e Portal do Aluno',
              content: 'Estimada Dra. Luísa,\n\nAgradecemos a preferência pela JOGIMIL Tecnologias. Em anexo, submetemos a nossa proposta comercial e o plano arquitetural em Cloud com suporte a pagamentos Multicaixa GPO.',
              timestamp: '09:15',
              delivered: true,
              read: true,
            },
            {
              id: 'm203',
              sender: 'customer',
              senderName: 'Dra. Luísa Furtado',
              channel: 'email',
              subject: 'Re: Proposta Comercial - Sistema de Gestão Escolar e Portal do Aluno',
              content: 'Agradeço o envio da minuta técnica com o cronograma de implementação. Vamos analisar no conselho de administração esta tarde.',
              timestamp: '09:20',
            },
          ],
        },
        {
          id: 'tick_3',
          customerName: 'Eng. António Silva',
          contact: '+244 942 775 559',
          channel: 'whatsapp',
          status: 'resolved',
          priority: 'low',
          subject: 'Desenvolvimento de App Mobile Flutter',
          lastMessage: 'Deploy em ambiente de testes homologado com sucesso.',
          updatedAt: 'Ontem',
          unreadCount: 0,
          messages: [
            {
              id: 'm301',
              sender: 'customer',
              senderName: 'Eng. António Silva',
              channel: 'whatsapp',
              content: 'O apk de testes já está disponível na Google Play Console?',
              timestamp: 'Ontem 16:30',
            },
            {
              id: 'm302',
              sender: 'agent',
              senderName: 'Engenharia JOGIMIL',
              channel: 'whatsapp',
              content: 'Sim engenheiro! A build #42 foi aprovada e já se encontra disponível para os utilizadores de teste.',
              timestamp: 'Ontem 16:35',
              delivered: true,
              read: true,
            },
          ],
        },
      ];
      setTickets(mock);
      setSelectedTicketId(mock[0].id);
      setActiveChannelMode(mock[0].channel);
      setEmailSubject(`Re: ${mock[0].subject}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSelectTicket = (ticket: SupportTicket) => {
    setSelectedTicketId(ticket.id);
    setActiveChannelMode(ticket.channel);
    setEmailSubject(ticket.subject.startsWith('Re:') ? ticket.subject : `Re: ${ticket.subject}`);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const newMessage: SupportMessage = {
      id: `m_${Date.now()}`,
      sender: 'agent',
      senderName: 'Operador JOGIMIL',
      channel: activeChannelMode,
      content: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      delivered: true,
      read: true,
      subject: activeChannelMode === 'email' ? emailSubject : undefined,
    };

    // Update locally
    const updatedTickets = tickets.map((t) => {
      if (t.id === activeTicket.id) {
        return {
          ...t,
          lastMessage: replyText,
          updatedAt: 'Agora',
          channel: activeChannelMode,
          messages: [...t.messages, newMessage],
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setReplyText('');

    // Try posting to backend
    try {
      await fetch('http://localhost:3001/api/v1/admin/support/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          message: newMessage,
        }),
      });
      setNotice(`Resposta enviada com sucesso via ${activeChannelMode === 'whatsapp' ? 'Evolution API (WhatsApp)' : 'SMTP Corporativo (Email)'}!`);
      setTimeout(() => setNotice(null), 4000);
    } catch {
      setNotice(`Mensagem despachada localmente no canal ${activeChannelMode.toUpperCase()}`);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleStatusChange = async (status: 'open' | 'in_progress' | 'resolved') => {
    if (!activeTicket) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, status } : t))
    );
    try {
      await fetch('http://localhost:3001/api/v1/admin/support/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: activeTicket.id, status }),
      });
    } catch {
      // offline ok
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesChannel = filterChannel === 'all' || t.channel === filterChannel;
    const matchesQuery =
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.contact.includes(searchQuery);
    return matchesChannel && matchesQuery;
  });

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 flex flex-col md:flex-row h-[780px] overflow-hidden ${
        isDark
          ? 'bg-[#090D16] border-[#1E293B] text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* LEFT COLUMN: TICKET LIST */}
      <div
        className={`w-full md:w-80 lg:w-96 flex flex-col border-b md:border-b-0 md:border-r ${
          isDark ? 'border-[#1E293B] bg-[#0B111E]' : 'border-slate-200 bg-slate-50/70'
        }`}
      >
        {/* Left Header */}
        <div className="p-4 border-b border-inherit space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-500">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Central Omnicanal</h3>
                <p className="text-[10px] text-slate-500">Atendimento WhatsApp & Email</p>
              </div>
            </div>
            <button
              onClick={loadTickets}
              title="Atualizar conversas"
              className={`p-1.5 rounded-lg transition ${
                isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar cliente, telefone ou assunto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border outline-none transition ${
                isDark
                  ? 'bg-[#131C2E] border-slate-700/60 text-white placeholder-slate-500 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Channel Filters */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setFilterChannel('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                filterChannel === 'all'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'bg-slate-800/60 text-slate-400 hover:text-white'
                  : 'bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({tickets.length})
            </button>
            <button
              onClick={() => setFilterChannel('whatsapp')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                filterChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white'
                  : isDark
                  ? 'bg-slate-800/60 text-emerald-400 hover:text-emerald-300'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <MessageSquare className="h-3 w-3" /> WhatsApp
            </button>
            <button
              onClick={() => setFilterChannel('email')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                filterChannel === 'email'
                  ? 'bg-blue-500 text-white'
                  : isDark
                  ? 'bg-slate-800/60 text-blue-400 hover:text-blue-300'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Mail className="h-3 w-3" /> Email
            </button>
          </div>
        </div>

        {/* Tickets Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-inherit">
          {filteredTickets.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhuma conversa encontrada neste canal.
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const isSelected = activeTicket?.id === ticket.id;
              const isWa = ticket.channel === 'whatsapp';

              return (
                <div
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`p-3.5 cursor-pointer transition-all duration-150 relative ${
                    isSelected
                      ? isDark
                        ? 'bg-blue-600/15 border-l-4 border-l-blue-500'
                        : 'bg-blue-50 border-l-4 border-l-blue-600'
                      : isDark
                      ? 'hover:bg-slate-800/40'
                      : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isWa
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}
                      >
                        {ticket.customerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{ticket.customerName}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{ticket.contact}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{ticket.updatedAt}</span>
                  </div>

                  <p className="text-[11px] line-clamp-1 text-slate-400 mb-2">
                    {ticket.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${
                        isWa
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {isWa ? <MessageSquare className="h-2.5 w-2.5" /> : <Mail className="h-2.5 w-2.5" />}
                      {isWa ? 'WhatsApp' : 'Email'}
                    </span>

                    <span
                      className={`px-1.5 py-0.5 rounded-full capitalize ${
                        ticket.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : ticket.status === 'in_progress'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {ticket.status === 'open'
                        ? 'Aberto'
                        : ticket.status === 'in_progress'
                        ? 'Em Atendimento'
                        : 'Resolvido'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC OMNICHANNEL CONVERSATION STAGE */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeTicket ? (
          <>
            {/* Top Toolbar with Dynamic Switcher */}
            <div
              className={`p-4 border-b border-inherit flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-[#0B111E]' : 'bg-slate-50/90'
              }`}
            >
              {/* Customer Profile Mini */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    activeChannelMode === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-[#0066FF] text-white shadow-md shadow-blue-600/30'
                  }`}
                >
                  {activeTicket.customerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate">{activeTicket.customerName}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        activeTicket.status === 'open'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : activeTicket.status === 'in_progress'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {activeTicket.status === 'open'
                        ? 'Aberto'
                        : activeTicket.status === 'in_progress'
                        ? 'Em Andamento'
                        : 'Resolvido'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{activeTicket.contact}</p>
                </div>
              </div>

              {/* Action Controls & Mode Switcher */}
              <div className="flex items-center gap-2">
                {/* DYNAMIC MODE SWITCHER (WhatsApp <-> Email) */}
                <div
                  className={`p-1 rounded-xl flex items-center gap-1 border ${
                    isDark ? 'bg-[#131C2E] border-slate-700/60' : 'bg-white border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setActiveChannelMode('whatsapp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeChannelMode === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Modo WhatsApp</span>
                  </button>

                  <button
                    onClick={() => setActiveChannelMode('email')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      activeChannelMode === 'email'
                        ? 'bg-[#0066FF] text-white shadow-sm'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Modo Email</span>
                  </button>
                </div>

                {/* Status selector */}
                <select
                  value={activeTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border font-medium outline-none ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white'
                      : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="open">Aberto</option>
                  <option value="in_progress">Em Atendimento</option>
                  <option value="resolved">Resolvido</option>
                </select>
              </div>
            </div>

            {/* Banner: Active Channel Details */}
            <div
              className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
                activeChannelMode === 'whatsapp'
                  ? isDark
                    ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isDark
                  ? 'bg-blue-950/20 border-blue-900/30 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {activeChannelMode === 'whatsapp' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Conexão Ativa via Evolution API · Luanda (+244)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Conexão Segura SMTP/IMAP · geral@jogimiltecnologias.it.ao</span>
                  </>
                )}
              </div>
              <span className="text-[11px] font-mono opacity-80">
                Ticket: #{activeTicket.id}
              </span>
            </div>

            {notice && (
              <div className="mx-4 mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{notice}</span>
              </div>
            )}

            {/* MESSAGE STREAM (DYNAMIC RENDERING ACCORDING TO MODE) */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                activeChannelMode === 'whatsapp'
                  ? isDark
                    ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-[#070b13]'
                    : 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50'
                  : isDark
                  ? 'bg-[#090D16]'
                  : 'bg-white'
              }`}
            >
              {/* Email Subject header if in Email mode */}
              {activeChannelMode === 'email' && (
                <div
                  className={`p-3 rounded-xl border mb-2 ${
                    isDark ? 'bg-[#111827] border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <div className="text-[11px] text-slate-400">Assunto:</div>
                  <div className="text-sm font-semibold">{activeTicket.subject}</div>
                </div>
              )}

              {activeTicket.messages.map((msg) => {
                const isCustomer = msg.sender === 'customer';

                if (activeChannelMode === 'whatsapp') {
                  // WHATSAPP BUBBLE STYLE
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-md ${
                          isCustomer
                            ? isDark
                              ? 'bg-[#1A2333] text-slate-100 rounded-tl-sm border border-slate-800'
                              : 'bg-white text-slate-900 rounded-tl-sm border border-slate-200'
                            : 'bg-emerald-600 text-white rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span
                            className={`text-[10px] font-bold ${
                              isCustomer ? 'text-blue-400' : 'text-emerald-100'
                            }`}
                          >
                            {msg.senderName}
                          </span>
                          <span
                            className={`text-[9px] ${
                              isCustomer ? 'text-slate-400' : 'text-emerald-200'
                            }`}
                          >
                            {msg.timestamp}
                          </span>
                        </div>
                        <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                        {!isCustomer && (
                          <div className="flex justify-end mt-1">
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-200" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // PROFESSIONAL EMAIL THREAD STYLE
                  return (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-xl border space-y-2 ${
                        isCustomer
                          ? isDark
                            ? 'bg-[#0E1524] border-slate-800'
                            : 'bg-slate-50 border-slate-200'
                          : isDark
                          ? 'bg-[#111C2E] border-blue-900/40'
                          : 'bg-blue-50/50 border-blue-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                              isCustomer
                                ? 'bg-slate-700 text-white'
                                : 'bg-[#0066FF] text-white'
                            }`}
                          >
                            {isCustomer ? 'C' : 'J'}
                          </div>
                          <div>
                            <span className="text-xs font-bold block">{msg.senderName}</span>
                            <span className="text-[10px] text-slate-400">
                              {isCustomer ? activeTicket.contact : 'suporte@jogimiltecnologias.it.ao'}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                      </div>

                      <div className="pt-2 text-xs leading-relaxed whitespace-pre-line text-inherit border-t border-inherit">
                        {msg.content}
                      </div>
                    </div>
                  );
                }
              })}
            </div>

            {/* COMPOSER / REPLY BOX (DYNAMIC ACCORDING TO MODE) */}
            <form
              onSubmit={handleSendReply}
              className={`p-4 border-t border-inherit ${
                isDark ? 'bg-[#0B111E]' : 'bg-slate-50/90'
              }`}
            >
              {activeChannelMode === 'email' && (
                <div className="mb-2">
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Assunto do email corporativo..."
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              )}

              {/* Quick Template pills for fast reply */}
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto no-scrollbar pb-1">
                <span className="text-[10px] text-slate-500 shrink-0 font-medium">Modelos:</span>
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      'Olá! Recebemos a sua solicitação com sucesso na JOGIMIL. Um dos nossos especialistas de engenharia já está a analisar.'
                    )
                  }
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  ⚡ Confirmação de Receção
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      'O módulo de faturamento SAF-T (AO) da JOGIMIL está totalmente certificado segundo as diretrizes mais recentes da AGT.'
                    )
                  }
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  📜 Conformidade AGT
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyText(
                      'Podemos agendar uma demonstração técnica via Google Meet ou presencialmente em Luanda para a sua equipa?'
                    )
                  }
                  className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap transition ${
                    isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  📅 Agendar Demonstração
                </button>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    rows={activeChannelMode === 'email' ? 4 : 2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      activeChannelMode === 'whatsapp'
                        ? 'Escreva uma mensagem para o WhatsApp do cliente...'
                        : 'Escreva a resposta formal por email com assinatura corporativa...'
                    }
                    className={`w-full p-3 text-xs rounded-xl border outline-none resize-none transition ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    title="Anexar documento ou imagem"
                    onClick={() => alert('Anexador de ficheiros ativado (PDF, PNG, JPG).')}
                    className={`p-2.5 rounded-xl border transition ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-slate-400 hover:text-white'
                        : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>

                  <button
                    type="submit"
                    className={`flex items-center justify-center p-2.5 rounded-xl text-white font-semibold shadow-md transition ${
                      activeChannelMode === 'whatsapp'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : 'bg-[#0066FF] hover:bg-blue-600 shadow-blue-600/30'
                    }`}
                    title={activeChannelMode === 'whatsapp' ? 'Enviar via WhatsApp' : 'Enviar via Email'}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <MessageSquare className="h-12 w-12 stroke-[1.5] text-slate-600 mb-3" />
            <h4 className="text-sm font-semibold">Nenhuma conversa selecionada</h4>
            <p className="text-xs">Selecione uma conversa ao lado para responder via WhatsApp ou Email.</p>
          </div>
        )}
      </div>
    </div>
  );
}
