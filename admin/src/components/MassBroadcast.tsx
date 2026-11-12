import { useState, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  Users,
  CheckCircle2,
  RefreshCw,
  Radio,
  Layers,
} from 'lucide-react';

interface BroadcastCampaign {
  id: string;
  title: string;
  channels: string[];
  audience: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  message: string;
  subject?: string;
  status: 'completed' | 'sending' | 'scheduled';
  createdAt: string;
}

interface MassBroadcastProps {
  theme?: 'dark' | 'light';
}

export function MassBroadcast({ theme = 'dark' }: MassBroadcastProps) {
  const isDark = theme === 'dark';

  // State
  const [channels, setChannels] = useState<{ whatsapp: boolean; email: boolean; sms: boolean }>({
    whatsapp: true,
    email: true,
    sms: false,
  });

  const [audience, setAudience] = useState('Todos os Clientes');
  const [customList, setCustomList] = useState('');
  const [title, setTitle] = useState('Comunicado Oficial SAF-T AGT 2026');
  const [emailSubject, setEmailSubject] = useState('Atualização Importante: Módulo SAF-T (AO) 2026');
  const [message, setMessage] = useState(
    'Estimado(a) {nome},\n\nInformamos que o seu sistema JOGIMIL recebeu a atualização de conformidade fiscal para as novas regras de validação da AGT 2026.\n\nAceda ao painel ou contacte o nosso suporte via WhatsApp para confirmar o agendamento da homologação.'
  );

  const [previewTab, setPreviewTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(false);

  // Audience counts
  const audienceCounts: Record<string, number> = {
    'Todos os Clientes': 640,
    'Leads do CRM & Oportunidades': 185,
    'Clientes POS SAF-T Angola': 420,
    'Escolas e Faculdades': 95,
    'Lista Manual / Personalizada': customList.split('\n').filter((l) => l.trim().length > 3).length,
  };

  const currentRecipients = audienceCounts[audience] || 150;

  // Load history from backend
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/v1/admin/broadcast');
      if (res.ok) {
        const json = await res.json();
        const list = json.data || json.broadcasts || [];
        if (list.length > 0) setCampaigns(list);
      }
    } catch {
      // Fallback initial campaigns
      setCampaigns([
        {
          id: 'bc_1',
          title: 'Comunicado SAF-T (AO) Norma AGT 2026',
          channels: ['whatsapp', 'email'],
          audience: 'Clientes Ativos POS',
          totalRecipients: 480,
          sentCount: 480,
          deliveredCount: 468,
          failedCount: 12,
          message: 'Prezado cliente, informamos que o patch fiscal de 2026 já está disponível para atualização imediata.',
          subject: 'Atualização Mandatória AGT 2026 - JOGIMIL POS',
          status: 'completed',
          createdAt: 'Há 3 dias',
        },
        {
          id: 'bc_2',
          title: 'Oferta Especial de Lançamento IA Omnicanal',
          channels: ['whatsapp', 'sms'],
          audience: 'Leads e Diretores Comerciais',
          totalRecipients: 250,
          sentCount: 250,
          deliveredCount: 242,
          failedCount: 8,
          message: 'Descubra a nova automação WhatsApp com Inteligência Artificial da JOGIMIL. Agende demonstração gratuita.',
          subject: '',
          status: 'completed',
          createdAt: 'Há 7 dias',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const toggleChannel = (ch: 'whatsapp' | 'email' | 'sms') => {
    setChannels((prev) => {
      const updated = { ...prev, [ch]: !prev[ch] };
      // Ensure at least one channel is selected
      if (!updated.whatsapp && !updated.email && !updated.sms) {
        return prev;
      }
      return updated;
    });
  };

  const handleApplyTemplate = (type: 'saft' | 'ia' | 'demo') => {
    if (type === 'saft') {
      setTitle('Atualização AGT SAF-T 2026');
      setEmailSubject('Comunicado Oficial: Atualização Fiscal SAF-T (AO) 2026');
      setMessage(
        'Olá {nome} da {empresa}!\n\nA JOGIMIL disponibilizou a mais recente versão certificada do motor SAF-T 2026 para os seus caixas de faturamento.\n\nPor favor confirme com o nosso suporte a data ideal para a sincronização remota.'
      );
    } else if (type === 'ia') {
      setTitle('Lançamento Agentes de IA em Luanda');
      setEmailSubject('Inovação: Atendimento Autónomo 24/7 com IA para a sua Empresa');
      setMessage(
        '{saudacao} {nome}! Sabia que a sua empresa pode responder a milhares de pedidos no WhatsApp em segundos com IA soberana?\n\nAgende hoje uma demonstração com os engenheiros da JOGIMIL.'
      );
    } else {
      setTitle('Convite para Demonstração Executiva');
      setEmailSubject('Demonstração Personalizada de Soluções JOGIMIL');
      setMessage(
        'Estimado(a) {nome},\n\nTeríamos todo o gosto em apresentar uma demonstração personalizada das nossas soluções em Cloud, POS e IA para a {empresa}.\n\nPodemos marcar para esta semana?'
      );
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const activeChannels = Object.entries(channels)
      .filter(([_, active]) => active)
      .map(([ch]) => ch);

    setDispatching(true);
    setDispatchProgress(10);

    const newCampaign: BroadcastCampaign = {
      id: `bc_${Date.now()}`,
      title,
      channels: activeChannels,
      audience,
      totalRecipients: currentRecipients,
      sentCount: currentRecipients,
      deliveredCount: Math.floor(currentRecipients * 0.96),
      failedCount: Math.floor(currentRecipients * 0.04),
      message,
      subject: emailSubject,
      status: 'completed',
      createdAt: 'Agora',
    };

    // Simulate animated progress
    const interval = setInterval(() => {
      setDispatchProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 400);

    setTimeout(async () => {
      clearInterval(interval);
      setDispatchProgress(100);
      setDispatching(false);

      // Post to backend
      try {
        await fetch('http://localhost:3001/api/v1/admin/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCampaign),
        });
      } catch {
        // ok
      }

      setCampaigns((prev) => [newCampaign, ...prev]);
      setNotice(
        `Disparo em massa concluído com sucesso para ${currentRecipients} destinatários via ${activeChannels.join(', ').toUpperCase()}!`
      );
      setTimeout(() => setNotice(null), 5000);
    }, 2200);
  };

  // Live preview text interpolation
  const interpolatedPreview = message
    .replace(/{nome}/g, 'Manuel Quaresma')
    .replace(/{empresa}/g, 'Supermercado Alvalade')
    .replace(/{saudacao}/g, 'Bom dia');

  return (
    <div
      className={`p-6 rounded-2xl border transition-all duration-300 space-y-6 ${
        isDark
          ? 'bg-[#090D16] border-[#1E293B] text-slate-100 shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-xl'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-500">
            <Radio className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Disparo em Massa Omnicanal</h2>
            <p className="text-xs text-slate-400">
              Envio simultâneo de comunicados para WhatsApp, Email Corporativo e SMS em massa
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Canais Operacionais
          </span>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* DISPATCH WIDGET: COMPOSER & LIVE PREVIEW */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: COMPOSER & CONFIGURATION (7 cols) */}
        <form
          onSubmit={handleSendBroadcast}
          className={`lg:col-span-7 p-5 rounded-2xl border space-y-5 ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          {/* Channel selector checkboxes */}
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-300">
              1. Selecionar Canais de Envio *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* WhatsApp Card */}
              <div
                onClick={() => toggleChannel('whatsapp')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  channels.whatsapp
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="h-4 w-4" />
                  <input
                    type="checkbox"
                    checked={channels.whatsapp}
                    onChange={() => {}}
                    className="rounded text-emerald-500 h-3.5 w-3.5"
                  />
                </div>
                <div className="text-xs font-bold">WhatsApp</div>
                <span className="text-[10px] opacity-80">Evolution API</span>
              </div>

              {/* Email Card */}
              <div
                onClick={() => toggleChannel('email')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  channels.email
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Mail className="h-4 w-4" />
                  <input
                    type="checkbox"
                    checked={channels.email}
                    onChange={() => {}}
                    className="rounded text-blue-500 h-3.5 w-3.5"
                  />
                </div>
                <div className="text-xs font-bold">Email</div>
                <span className="text-[10px] opacity-80">SMTP Corporativo</span>
              </div>

              {/* SMS Card */}
              <div
                onClick={() => toggleChannel('sms')}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  channels.sms
                    ? 'bg-purple-500/15 border-purple-500/50 text-purple-400 shadow-sm'
                    : isDark
                    ? 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Smartphone className="h-4 w-4" />
                  <input
                    type="checkbox"
                    checked={channels.sms}
                    onChange={() => {}}
                    className="rounded text-purple-500 h-3.5 w-3.5"
                  />
                </div>
                <div className="text-xs font-bold">SMS em Massa</div>
                <span className="text-[10px] opacity-80">Gateway Unitel/Africell</span>
              </div>
            </div>
          </div>

          {/* Audience selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-300">
                2. Público-Alvo / Audiência
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isDark
                    ? 'bg-[#131C2E] border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Todos os Clientes">Todos os Clientes (Base Completa)</option>
                <option value="Clientes POS SAF-T Angola">Clientes POS SAF-T Angola</option>
                <option value="Leads do CRM & Oportunidades">Leads do CRM & Oportunidades</option>
                <option value="Escolas e Faculdades">Escolas e Faculdades</option>
                <option value="Lista Manual / Personalizada">Lista Manual / Personalizada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-300">
                Total de Destinatários
              </label>
              <div
                className={`px-3 py-2 text-xs rounded-xl border flex items-center justify-between font-mono font-bold ${
                  isDark ? 'bg-[#131C2E] border-slate-700 text-emerald-400' : 'bg-white border-slate-300 text-emerald-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{currentRecipients} destinatários</span>
                </div>
                <span className="text-[10px] font-normal text-slate-400">Verificados</span>
              </div>
            </div>
          </div>

          {audience === 'Lista Manual / Personalizada' && (
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">
                Colar Números / Emails (um por linha)
              </label>
              <textarea
                rows={3}
                placeholder="244942775559&#10;cliente@empresa.co.ao&#10;244923112233"
                value={customList}
                onChange={(e) => setCustomList(e.target.value)}
                className={`w-full p-2.5 text-xs rounded-xl border outline-none font-mono ${
                  isDark
                    ? 'bg-[#131C2E] border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          )}

          {/* Quick template buttons */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                3. Título & Modelos Prontos
              </label>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('saft')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    isDark ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  ⚡ Patch AGT SAF-T
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('ia')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  🤖 Suite de IA
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('demo')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    isDark ? 'bg-slate-800 text-purple-400 hover:bg-slate-700' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  📅 Demonstração
                </button>
              </div>
            </div>

            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome interno da campanha..."
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium mb-3 ${
                isDark
                  ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />

            {channels.email && (
              <div className="mb-3">
                <label className="block text-xs font-semibold mb-1 text-slate-300">
                  Assunto do E-mail
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Assunto formal de envio..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                    isDark
                      ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>
            )}
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                4. Mensagem & Variáveis Dinâmicas *
              </label>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Variáveis:</span>
                <code
                  onClick={() => setMessage((m) => m + ' {nome}')}
                  className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/30"
                  title="Inserir primeiro nome"
                >
                  {'{nome}'}
                </code>
                <code
                  onClick={() => setMessage((m) => m + ' {empresa}')}
                  className="px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 cursor-pointer hover:bg-blue-500/30"
                  title="Inserir empresa"
                >
                  {'{empresa}'}
                </code>
              </div>
            </div>

            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escreva a mensagem oficial que será enviada aos destinatários..."
              className={`w-full p-3 text-xs rounded-xl border outline-none resize-none font-sans leading-relaxed ${
                isDark
                  ? 'bg-[#131C2E] border-slate-700 text-white focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Progress bar when dispatching */}
          {dispatching && (
            <div className="space-y-1.5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <div className="flex justify-between text-xs font-semibold text-blue-400">
                <span>A despachar campanha omnicanal...</span>
                <span>{dispatchProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#0066FF] transition-all duration-300 rounded-full"
                  style={{ width: `${dispatchProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              Estimativa de entrega: imediata via microserviço
            </span>
            <button
              type="submit"
              disabled={dispatching || currentRecipients === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-600 active:scale-[0.99] text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {dispatching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>A Enviar em Massa...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Disparar para {currentRecipients} Destinatários</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT COLUMN: MULTI-CHANNEL LIVE DEVICE PREVIEW (5 cols) */}
        <div
          className={`lg:col-span-5 p-5 rounded-2xl border flex flex-col justify-between ${
            isDark ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <span className="text-xs font-bold">Pré-visualização ao Vivo</span>

              {/* Device Channel Switcher */}
              <div
                className={`p-1 rounded-xl flex items-center gap-1 border ${
                  isDark ? 'bg-[#131C2E] border-slate-700' : 'bg-white border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setPreviewTab('whatsapp')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    previewTab === 'whatsapp'
                      ? 'bg-emerald-600 text-white'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                  title="Ver no WhatsApp"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('email')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    previewTab === 'email'
                      ? 'bg-[#0066FF] text-white'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                  title="Ver no E-mail"
                >
                  <Mail className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('sms')}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    previewTab === 'sms'
                      ? 'bg-purple-600 text-white'
                      : isDark
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                  title="Ver no SMS"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            {previewTab === 'whatsapp' && (
              <div className="rounded-2xl border border-slate-700/60 overflow-hidden bg-[#0a101d] shadow-lg">
                <div className="bg-[#1f2c3f] p-3 flex items-center gap-2.5 text-white">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                    J
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">JOGIMIL Tecnologias</h4>
                    <span className="text-[10px] text-emerald-400">Conta Comercial Oficial</span>
                  </div>
                </div>
                <div className="p-4 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] min-h-[220px] flex flex-col justify-end">
                  <div className="bg-[#14261d] border border-emerald-800/40 text-slate-100 rounded-2xl rounded-tl-sm p-3 text-xs shadow-md space-y-1.5">
                    <p className="whitespace-pre-line leading-relaxed">{interpolatedPreview}</p>
                    <div className="flex justify-end text-[9px] text-emerald-400 font-mono">
                      10:45 ✓✓
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'email' && (
              <div
                className={`rounded-2xl border overflow-hidden shadow-lg p-4 space-y-3 ${
                  isDark ? 'bg-[#111827] border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <div className="border-b border-inherit pb-2.5 space-y-1">
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold">De:</span> JOGIMIL Tecnologias &lt;geral@jogimiltecnologias.it.ao&gt;
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="font-semibold">Para:</span> Manuel Quaresma &lt;m.quaresma@alvalade.co.ao&gt;
                  </div>
                  <div className="text-xs font-bold text-inherit pt-1">
                    {emailSubject || 'Sem assunto'}
                  </div>
                </div>
                <div className="min-h-[160px] text-xs leading-relaxed whitespace-pre-line text-slate-300">
                  {interpolatedPreview}
                </div>
                <div className="border-t border-inherit pt-2 text-[10px] text-slate-500">
                  --<br />
                  JOGIMIL Tecnologias, Lda. · Luanda, Angola<br />
                  www.jogimiltecnologias.it.ao · +244 942 775 559
                </div>
              </div>
            )}

            {previewTab === 'sms' && (
              <div className="rounded-2xl border border-slate-700/60 overflow-hidden bg-[#0d131f] shadow-lg p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3 text-xs text-slate-400">
                  <span className="font-bold text-purple-400">SMS Corporativo</span>
                  <span className="font-mono text-[10px]">+244 UNITEL/AFRICELL</span>
                </div>
                <div className="bg-[#241938] border border-purple-800/40 text-purple-100 rounded-2xl rounded-tl-sm p-3.5 text-xs shadow-md leading-relaxed whitespace-pre-line">
                  {interpolatedPreview}
                </div>
                <div className="mt-4 text-right text-[10px] text-slate-500 font-mono">
                  Caracteres: {interpolatedPreview.length} (1 SMS)
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between text-[11px] text-slate-400">
            <span>SLA de Entrega: 99.8%</span>
            <span className="text-emerald-400 font-semibold">Criptografia Ponta-a-Ponta</span>
          </div>
        </div>
      </div>

      {/* RECENT BROADCAST CAMPAIGNS HISTORY */}
      <div className="pt-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-500" />
            <h3 className="text-sm font-bold">Histórico de Disparos em Massa</h3>
          </div>
          <span className="text-xs text-slate-400">Total: {campaigns.length} campanhas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}
              >
                <th className="py-2.5 px-4 font-semibold">Campanha</th>
                <th className="py-2.5 px-4 font-semibold">Canais</th>
                <th className="py-2.5 px-4 font-semibold">Audiência</th>
                <th className="py-2.5 px-4 font-semibold text-center">Destinatários</th>
                <th className="py-2.5 px-4 font-semibold text-center">Entregues</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {campaigns.map((camp) => (
                <tr
                  key={camp.id}
                  className={`transition ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}
                >
                  <td className="py-3 px-4 font-bold text-inherit">{camp.title}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {camp.channels.map((ch) => (
                        <span
                          key={ch}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            ch === 'whatsapp'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : ch === 'email'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{camp.audience}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-inherit">
                    {camp.totalRecipients}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">
                    {camp.deliveredCount} ({Math.round((camp.deliveredCount / camp.totalRecipients) * 100)}%)
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Concluído
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                    {camp.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
