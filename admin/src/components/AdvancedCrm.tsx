import { useState, useEffect } from 'react';
import {
  Contact2,
  Plus,
  Search,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ChevronRight,
  MessageSquare,
  Smartphone,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface Interaction {
  id: string;
  channel: string;
  type: string;
  note: string;
  timestamp: string;
  agent: string;
}

interface CrmDeal {
  id: string;
  clientName: string;
  company: string;
  value: number;
  stage: 'novo_lead' | 'contacto' | 'demonstracao' | 'proposta' | 'negociacao' | 'ganho' | 'perdido';
  probability: number;
  primaryChannel: 'whatsapp' | 'email' | 'sms' | 'phone';
  contactPhone: string;
  contactEmail: string;
  expectedCloseDate: string;
  assignedAgent: string;
  productInterest: string;
  interactions: Interaction[];
  createdAt: string;
  updatedAt: string;
}

interface AdvancedCrmProps {
  theme?: 'dark' | 'light';
}

const STAGES = [
  { id: 'novo_lead', label: 'Novo Lead', color: '#64748B', prob: 20 },
  { id: 'contacto', label: 'Contacto Feito', color: '#38BDF8', prob: 40 },
  { id: 'demonstracao', label: 'Demonstração', color: '#0066FF', prob: 60 },
  { id: 'proposta', label: 'Proposta Enviada', color: '#818CF8', prob: 75 },
  { id: 'negociacao', label: 'Negociação', color: '#F59E0B', prob: 90 },
  { id: 'ganho', label: 'Ganho / Fechado', color: '#10B981', prob: 100 },
];

export function AdvancedCrm({ theme = 'dark' }: AdvancedCrmProps) {
  const isDark = theme === 'dark';

  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'funnel' | 'analytics' | 'list'>('funnel');

  // Selected Deal for Drawer/Timeline
  const [selectedDeal, setSelectedDeal] = useState<CrmDeal | null>(null);
  const [newNote, setNewNote] = useState('');
  const [newNoteType, setNewNoteType] = useState('Conversa WhatsApp');
  const [newNoteChannel, setNewNoteChannel] = useState('whatsapp');

  // Modal for new Deal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [dealValue, setDealValue] = useState('3500000');
  const [productInterest, setProductInterest] = useState('POS SAF-T Angola (3 Caixas)');
  const [contactPhone, setContactPhone] = useState('+244 9');
  const [contactEmail, setContactEmail] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('Joel Gaspar');
  const [primaryChannel, setPrimaryChannel] = useState<'whatsapp' | 'email' | 'sms' | 'phone'>('whatsapp');
  const [notice, setNotice] = useState<string | null>(null);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/crm/deals');
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json.deals || [];
        if (list.length > 0) setDeals(list);
      }
    } catch {
      // Local fallback initial mock
      setDeals([
        {
          id: 'deal_101',
          clientName: 'Manuel Quaresma',
          company: 'Supermercado Alvalade, Lda',
          value: 3850000,
          stage: 'negociacao',
          probability: 80,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 923 881 229',
          contactEmail: 'm.quaresma@alvalade.co.ao',
          expectedCloseDate: '2026-03-30',
          assignedAgent: 'Joel Gaspar',
          productInterest: 'POS SAF-T Angola (3 Caixas)',
          interactions: [
            {
              id: 'int_1',
              channel: 'whatsapp',
              type: 'Reunião de Alinhamento',
              note: 'Cliente confirmou orçamento de 3.850.000 Kz. Aguarda minuta final de contrato.',
              timestamp: 'Ontem, 16:40',
              agent: 'Joel Gaspar',
            },
            {
              id: 'int_2',
              channel: 'email',
              type: 'Envio de Proposta',
              note: 'Enviada minuta técnica com arquitetura de backup offline para Luanda.',
              timestamp: '08 Mar, 11:20',
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: '2026-03-01',
          updatedAt: '2026-03-09',
        },
        {
          id: 'deal_102',
          clientName: 'Dra. Luísa Furtado',
          company: 'Complexo Escolar Milénio',
          value: 5200000,
          stage: 'proposta',
          probability: 60,
          primaryChannel: 'email',
          contactPhone: '+244 912 340 991',
          contactEmail: 'luisa.furtado@colegiomilenio.ao',
          expectedCloseDate: '2026-04-10',
          assignedAgent: 'Helena Kiala',
          productInterest: 'Portal Acadêmico Cloud + Propinas GPO',
          interactions: [
            {
              id: 'int_3',
              channel: 'email',
              type: 'Apresentação Comercial',
              note: 'Diretoria analisou o plano de 5.200.000 Kz para 2.400 alunos matriculados.',
              timestamp: '07 Mar, 14:15',
              agent: 'Helena Kiala',
            },
          ],
          createdAt: '2026-03-02',
          updatedAt: '2026-03-07',
        },
        {
          id: 'deal_103',
          clientName: 'Eng. António Silva',
          company: 'Logística & Navegação Luanda',
          value: 7800000,
          stage: 'ganho',
          probability: 100,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 942 775 559',
          contactEmail: 'antonio.silva@logluanda.ao',
          expectedCloseDate: '2026-03-08',
          assignedAgent: 'Joel Gaspar',
          productInterest: 'Assistente IA Omnicanal + GPS Mobile',
          interactions: [
            {
              id: 'int_4',
              channel: 'whatsapp',
              type: 'Contrato Assinado',
              note: 'Primeira tranche de pagamento liquidada via transferência bancária BFA.',
              timestamp: '08 Mar, 10:00',
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: '2026-02-20',
          updatedAt: '2026-03-08',
        },
        {
          id: 'deal_104',
          clientName: 'Dr. Paulo Kassoma',
          company: 'Clínica Sagrada Esperança Parceiros',
          value: 4100000,
          stage: 'demonstracao',
          probability: 40,
          primaryChannel: 'whatsapp',
          contactPhone: '+244 931 100 240',
          contactEmail: 'paulo.k@clinicasagrada.co.ao',
          expectedCloseDate: '2026-04-05',
          assignedAgent: 'Mauro dos Santos',
          productInterest: 'Agendamento Clínico com Bot WhatsApp',
          interactions: [
            {
              id: 'int_5',
              channel: 'whatsapp',
              type: 'Demonstração Agendada',
              note: 'Demonstração ao vivo agendada para sexta-feira às 14h30.',
              timestamp: 'Hoje, 09:30',
              agent: 'Mauro dos Santos',
            },
          ],
          createdAt: '2026-03-05',
          updatedAt: '2026-03-09',
        },
        {
          id: 'deal_105',
          clientName: 'Kátia dos Remédios',
          company: 'Grupo Hoteleiro Baía de Luanda',
          value: 6400000,
          stage: 'novo_lead',
          probability: 20,
          primaryChannel: 'sms',
          contactPhone: '+244 928 554 112',
          contactEmail: 'remedios@hotelbaia.ao',
          expectedCloseDate: '2026-04-20',
          assignedAgent: 'Joel Gaspar',
          productInterest: 'Suite Completa Hotelaria & POS Restaurante',
          interactions: [
            {
              id: 'int_6',
              channel: 'sms',
              type: 'Lead Recebido',
              note: 'Contacto recebido através de campanha SMS em massa.',
              timestamp: 'Ontem, 18:20',
              agent: 'Joel Gaspar',
            },
          ],
          createdAt: '2026-03-08',
          updatedAt: '2026-03-08',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Format Kwanzas currency
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    })
      .format(val)
      .replace('AOA', 'Kz');
  };

  // KPIs
  const totalPipeline = deals.reduce((acc, d) => acc + d.value, 0);
  const totalWon = deals.filter((d) => d.stage === 'ganho').reduce((acc, d) => acc + d.value, 0);
  const totalInteractions = deals.reduce((acc, d) => acc + d.interactions.length, 0);
  const winRate =
    deals.length > 0
      ? Math.round((deals.filter((d) => d.stage === 'ganho').length / deals.length) * 100)
      : 0;

  // Chart data: Stage breakdown
  const stageChartData = STAGES.map((st) => {
    const dealsInStage = deals.filter((d) => d.stage === st.id);
    const sumValue = dealsInStage.reduce((acc, d) => acc + d.value, 0);
    return {
      name: st.label,
      count: dealsInStage.length,
      valor: Math.round(sumValue / 1000000), // in Millions Kz
    };
  });

  // Chart data: Channel distribution
  const channelChartData = [
    { name: 'WhatsApp', value: deals.filter((d) => d.primaryChannel === 'whatsapp').length, color: '#10B981' },
    { name: 'Email', value: deals.filter((d) => d.primaryChannel === 'email').length, color: '#0066FF' },
    { name: 'SMS', value: deals.filter((d) => d.primaryChannel === 'sms').length, color: '#8B5CF6' },
    { name: 'Telefone', value: deals.filter((d) => d.primaryChannel === 'phone').length, color: '#F59E0B' },
  ].filter((c) => c.value > 0);

  // Handle stage change
  const handleUpdateStage = async (dealId: string, nextStage: CrmDeal['stage']) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: nextStage } : d))
    );
    if (selectedDeal?.id === dealId) {
      setSelectedDeal((prev) => (prev ? { ...prev, stage: nextStage } : null));
    }
    try {
      await fetch(`http://localhost:3001/api/v1/admin/crm/deals/${dealId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: nextStage }),
      });
    } catch {
      // ok
    }
  };

  // Add new interaction
  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedDeal) return;

    const interaction: Interaction = {
      id: `int_${Date.now()}`,
      channel: newNoteChannel,
      type: newNoteType,
      note: newNote,
      timestamp: 'Agora',
      agent: 'Joel Gaspar',
    };

    const updatedDeals = deals.map((d) => {
      if (d.id === selectedDeal.id) {
        return {
          ...d,
          interactions: [interaction, ...d.interactions],
          updatedAt: 'Hoje',
        };
      }
      return d;
    });

    setDeals(updatedDeals);
    setSelectedDeal({
      ...selectedDeal,
      interactions: [interaction, ...selectedDeal.interactions],
    });
    setNewNote('');

    try {
      await fetch(
        `http://localhost:3001/api/v1/admin/crm/deals/${selectedDeal.id}/interactions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(interaction),
        }
      );
    } catch {
      // ok
    }
  };

  // Create new Deal
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !company.trim()) return;

    const newDeal: CrmDeal = {
      id: `deal_${Date.now()}`,
      clientName,
      company,
      value: Number(dealValue) || 2500000,
      stage: 'novo_lead',
      probability: 20,
      primaryChannel,
      contactPhone,
      contactEmail,
      expectedCloseDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      assignedAgent,
      productInterest,
      interactions: [
        {
          id: `int_${Date.now()}`,
          channel: primaryChannel,
          type: 'Novo Lead Criado',
          note: `Lead registado no CRM para o produto: ${productInterest}`,
          timestamp: 'Agora',
          agent: assignedAgent,
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: 'Agora',
    };

    setDeals([newDeal, ...deals]);
    setCreateModalOpen(false);
    setNotice(`Negócio com a ${company} adicionado com sucesso ao CRM!`);
    setTimeout(() => setNotice(null), 4000);

    try {
      await fetch('http://localhost:3001/api/v1/admin/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDeal),
      });
    } catch {
      // ok
    }

    setClientName('');
    setCompany('');
  };

  const filteredDeals = deals.filter((d) => {
    const matchesSearch =
      d.clientName.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase()) ||
      d.productInterest.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || d.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 space-y-6 ${
        isDark
          ? 'bg-[#090D16] border-[#1E293B] text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
            <Contact2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">CRM Executivo & Funil de Vendas</h2>
            <p className="text-xs text-slate-400">
              Acompanhamento inteligente do estado de cada venda, oportunidade e histórico de interações
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          {/* View switcher */}
          <div
            className={`p-1 rounded-xl flex items-center gap-1 border ${
              isDark ? 'bg-[#131C2E] border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <button
              onClick={() => setViewMode('funnel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'funnel'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quadro Funil (Kanban)
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'analytics'
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gráficos & Análises
            </button>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Negócio</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Pipeline em Aberto</span>
          <div className="text-xl font-bold text-inherit">{formatKz(totalPipeline)}</div>
          <span className="text-[10px] text-blue-400 font-medium">Oportunidades ativas</span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Vendas Conquistadas (Ganho)</span>
          <div className="text-xl font-bold text-emerald-400">{formatKz(totalWon)}</div>
          <span className="text-[10px] text-emerald-400 font-medium">Faturamento fechado</span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Taxa de Conversão</span>
          <div className="text-xl font-bold text-blue-400">{winRate}%</div>
          <span className="text-[10px] text-slate-400">Sucesso do funil</span>
        </div>

        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Histórico de Interações</span>
          <div className="text-xl font-bold text-inherit">{totalInteractions}</div>
          <span className="text-[10px] text-purple-400">Pontos de contacto</span>
        </div>
      </div>

      {/* VIEW: ANÁLISES & GRÁFICOS */}
      {viewMode === 'analytics' && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Funnel Stage Volume & Value Chart */}
          <div
            className={`md:col-span-8 p-5 rounded-2xl border space-y-4 ${
              isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Volume Financeiro por Estágio do Funil</h3>
                <p className="text-[11px] text-slate-400">Valores consolidados em Milhões de Kwanzas (Kz)</p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-400">M / Kz</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} unit="M" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#090D16' : '#FFFFFF',
                      borderColor: isDark ? '#1E293B' : '#CBD5E1',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="valor" fill="#0066FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Channel Share Pie Chart */}
          <div
            className={`md:col-span-4 p-5 rounded-2xl border space-y-4 flex flex-col justify-between ${
              isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div>
              <h3 className="text-sm font-bold">Origem dos Leads por Canal</h3>
              <p className="text-[11px] text-slate-400">Proporção de negócios por canal primário</p>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-inherit">
              {channelChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                  <span className="font-bold font-mono">{item.value} neg.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar cliente, empresa ou solução..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border outline-none font-medium ${
              isDark
                ? 'bg-[#131C2E] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className={`text-xs px-3 py-1.5 rounded-xl border outline-none font-medium ${
              isDark
                ? 'bg-[#131C2E] border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="all">Todos os Estágios</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW: KANBAN FUNNEL BOARD */}
      {viewMode === 'funnel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((st) => {
            const stageDeals = filteredDeals.filter((d) => d.stage === st.id);
            const stageSum = stageDeals.reduce((acc, d) => acc + d.value, 0);

            return (
              <div
                key={st.id}
                className={`rounded-2xl border flex flex-col p-3 min-w-[240px] ${
                  isDark ? 'bg-[#0B111E] border-slate-800/80' : 'bg-slate-100/70 border-slate-200'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-inherit">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="text-xs font-bold truncate">{st.label}</span>
                  </div>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-md font-bold bg-slate-800/60 text-slate-300">
                    {stageDeals.length}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 mb-3 font-mono">
                  Total: {formatKz(stageSum)}
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[600px] no-scrollbar">
                  {stageDeals.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-500 border border-dashed border-slate-700/50 rounded-xl">
                      Sem negócios nesta fase
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedDeal(deal)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                          isDark
                            ? 'bg-[#111827] border-slate-800 hover:border-blue-500/50'
                            : 'bg-white border-slate-200 hover:border-blue-500/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <h4 className="text-xs font-bold truncate text-inherit">
                            {deal.company}
                          </h4>
                          <span
                            className={`p-1 rounded-md text-[10px] shrink-0 ${
                              deal.primaryChannel === 'whatsapp'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : deal.primaryChannel === 'email'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-purple-500/10 text-purple-400'
                            }`}
                          >
                            {deal.primaryChannel === 'whatsapp' && <MessageSquare className="h-3 w-3" />}
                            {deal.primaryChannel === 'email' && <Mail className="h-3 w-3" />}
                            {deal.primaryChannel === 'sms' && <Smartphone className="h-3 w-3" />}
                            {deal.primaryChannel === 'phone' && <Phone className="h-3 w-3" />}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 truncate mb-2">
                          {deal.clientName}
                        </p>

                        <div className="text-xs font-bold text-blue-400 mb-2 font-mono">
                          {formatKz(deal.value)}
                        </div>

                        <div className="text-[10px] text-slate-500 truncate mb-2.5">
                          {deal.productInterest}
                        </div>

                        {/* Footer: interactions count & quick advance */}
                        <div className="pt-2 border-t border-inherit flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-500" />
                            {deal.interactions.length} interações
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndex = STAGES.findIndex((s) => s.id === deal.stage);
                              if (currentIndex < STAGES.length - 1) {
                                handleUpdateStage(deal.id, STAGES[currentIndex + 1].id as any);
                              }
                            }}
                            title="Avançar para próximo estágio"
                            className="p-1 rounded hover:bg-blue-500/20 hover:text-blue-400 transition"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER / DETAILS MODAL FOR SELECTED DEAL & INTERACTIONS TIMELINE */}
      {selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0E1524] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-inherit">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold">{selectedDeal.company}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {formatKz(selectedDeal.value)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Contacto: {selectedDeal.clientName} · {selectedDeal.contactPhone}
                </p>
              </div>

              <button
                onClick={() => setSelectedDeal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stage Selector Pill */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Estágio no Funil:</label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleUpdateStage(selectedDeal.id, s.id as any)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedDeal.stage === s.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : isDark
                        ? 'bg-slate-800 text-slate-400 hover:text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick action buttons (Direct WhatsApp / Email) */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href={`https://wa.me/${selectedDeal.contactPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Conversar no WhatsApp</span>
              </a>

              {selectedDeal.contactEmail && (
                <a
                  href={`mailto:${selectedDeal.contactEmail}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0066FF] hover:bg-blue-600 text-white shadow-sm transition"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Enviar Email</span>
                </a>
              )}
            </div>

            {/* NEW INTERACTION FORM */}
            <form onSubmit={handleAddInteraction} className="p-3.5 rounded-xl border border-inherit space-y-3 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Registar Nova Interação / Nota
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <select
                    value={newNoteType}
                    onChange={(e) => setNewNoteType(e.target.value)}
                    className="bg-transparent border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="Conversa WhatsApp">Conversa WhatsApp</option>
                    <option value="Envio de Email">Envio de Email</option>
                    <option value="Chamada Telefónica">Chamada Telefónica</option>
                    <option value="Reunião Presencial">Reunião Presencial</option>
                    <option value="Envio de Proposta">Envio de Proposta</option>
                  </select>
                  <select
                    value={newNoteChannel}
                    onChange={(e) => setNewNoteChannel(e.target.value)}
                    className="bg-transparent border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-slate-300 outline-none"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="phone">Chamada</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              <textarea
                rows={2}
                required
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ex: Cliente aprovou demonstração do SAF-T e solicitou envio de fatura pró-forma..."
                className={`w-full p-2.5 text-xs rounded-xl border outline-none resize-none ${
                  isDark
                    ? 'bg-[#131C2E] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-[#0066FF] hover:bg-blue-600 text-white text-xs font-bold transition"
                >
                  Guardar Interação
                </button>
              </div>
            </form>

            {/* INTERACTIONS TIMELINE */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Histórico de Interações ({selectedDeal.interactions.length})
              </h4>

              <div className="space-y-2.5">
                {selectedDeal.interactions.map((int) => (
                  <div
                    key={int.id}
                    className={`p-3 rounded-xl border space-y-1 ${
                      isDark ? 'bg-[#131C2E] border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-blue-400">{int.type}</span>
                        <span className="text-slate-500">via {int.channel}</span>
                      </div>
                      <span className="text-slate-400 font-mono">{int.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{int.note}</p>
                    <div className="text-[10px] text-slate-500">Registo por: {int.agent}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO NEGÓCIO NO CRM */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl ${
              isDark ? 'bg-[#0E1524] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2">
                <Contact2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-bold">Novo Negócio / Lead no CRM</h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Nome da Empresa / Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Grupo Comercial Alvalade"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Pessoa de Contacto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Manuel Quaresma"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Valor Estimado (Kwanzas - Kz) *
                  </label>
                  <input
                    type="number"
                    required
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Canal Primário
                  </label>
                  <select
                    value={primaryChannel}
                    onChange={(e) => setPrimaryChannel(e.target.value as any)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="whatsapp">WhatsApp (Evolution API)</option>
                    <option value="email">Email Corporativo</option>
                    <option value="sms">SMS em Massa</option>
                    <option value="phone">Chamada Telefónica</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Solução / Interesse
                  </label>
                  <select
                    value={productInterest}
                    onChange={(e) => setProductInterest(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="POS SAF-T Angola (3 Caixas)">POS SAF-T Angola (Retalho/Supermercado)</option>
                    <option value="Suite de IA Omnicanal WhatsApp">Suite de IA Omnicanal WhatsApp</option>
                    <option value="Portal Acadêmico Cloud + Propinas">Portal Acadêmico Cloud + Propinas</option>
                    <option value="App Mobile Flutter + Backend">App Mobile Flutter + Backend</option>
                    <option value="Consultoria de Arquitetura Cloud">Consultoria de Arquitetura Cloud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Consultor Responsável
                  </label>
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Joel Gaspar">Joel Gaspar</option>
                    <option value="Helena Kiala">Helena Kiala</option>
                    <option value="Mauro dos Santos">Mauro dos Santos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Telefone WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+244 9..."
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-mono ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-300">
                    Email Corporativo
                  </label>
                  <input
                    type="email"
                    placeholder="contacto@empresa.ao"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                      isDark
                        ? 'bg-[#131C2E] border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                    isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-[#0066FF] hover:bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition"
                >
                  Criar Negócio no CRM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
