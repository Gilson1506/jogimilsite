import { useEffect, useState } from 'react';
import { MessageSquare, Mail, RefreshCw } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { AdminIcon3D } from './AdminIcon3D';

interface DashboardMetricsProps {
  theme?: 'dark' | 'light';
}

interface DashboardSummary {
  totalContacts: number;
  newContacts: number;
  pendingReminders: number;
  totalNews: number;
  totalMessages: number;
  whatsappConnected: boolean;
  whatsappState: string;
  emailOperational: boolean;
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  activeNow: number;
}

export function DashboardMetrics(_props: DashboardMetricsProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{ success: boolean; summary: DashboardSummary }>('/api/v1/admin/dashboard');
      if (data?.summary) {
        setSummary(data.summary);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const timer = setInterval(loadMetrics, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
            <AdminIcon3D name="dashboard" size={26} />
            <span>Visão Geral</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* 4 KPIs Elevados · Ícones 3D flutuantes sem caixa de cor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="group ds-card ds-card-interactive p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider ds-muted pt-1">
              Visitas do Portal (30d)
            </span>
            <AdminIcon3D name="visits" size={40} />
          </div>
          <div>
            <p className="text-3xl font-semibold font-mono tabular-nums tracking-tight">
              {(summary?.totalVisits ?? 0).toLocaleString('pt-PT')}
            </p>
            <p className="text-xs ds-muted mt-1">
              Hoje:{' '}
              <span className="font-mono font-semibold text-[rgb(var(--text))]">
                {summary?.todayVisits ?? 0}
              </span>{' '}
              visualizações
            </p>
          </div>
        </div>

        <div className="group ds-card ds-card-interactive p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider ds-muted pt-1">
              Visitantes Únicos
            </span>
            <AdminIcon3D name="users" size={40} />
          </div>
          <div>
            <p className="text-3xl font-semibold font-mono tabular-nums tracking-tight">
              {(summary?.uniqueVisitors ?? 0).toLocaleString('pt-PT')}
            </p>
            <p className="text-xs ds-muted mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono font-semibold text-[rgb(var(--text))]">
                {summary?.activeNow ?? 0}
              </span>{' '}
              ativos agora no portal
            </p>
          </div>
        </div>

        <div className="group ds-card ds-card-interactive p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider ds-muted pt-1">
              Contactos & Leads
            </span>
            <AdminIcon3D name="contacts" size={40} />
          </div>
          <div>
            <p className="text-3xl font-semibold font-mono tabular-nums tracking-tight">
              {(summary?.totalContacts ?? 0).toLocaleString('pt-PT')}
            </p>
            <p className="text-xs ds-muted mt-1">
              Novos:{' '}
              <span className="font-mono font-semibold text-amber-400">
                {summary?.newContacts ?? 0}
              </span>{' '}
              · <span className="font-mono">{summary?.totalMessages ?? 0}</span> interações
            </p>
          </div>
        </div>

        <div className="group ds-card ds-card-interactive p-5 flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider ds-muted pt-1">
              Canais & Conteúdo
            </span>
            <AdminIcon3D name="channels" size={40} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 ds-muted">
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
              </span>
              <span
                className={`font-mono font-semibold ${
                  summary?.whatsappConnected ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {summary?.whatsappConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 ds-muted">
                <Mail className="h-3.5 w-3.5 text-brand" /> SMTP / IMAP
              </span>
              <span
                className={`font-mono font-semibold ${
                  summary?.emailOperational ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {summary?.emailOperational ? 'Operacional' : 'Verificar ENV'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="ds-muted">Notícias no Portal</span>
              <span className="font-mono font-semibold">{summary?.totalNews ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
