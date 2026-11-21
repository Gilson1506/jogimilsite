import { useEffect, useState } from 'react';
import { Globe, Monitor, Smartphone, Tablet, Clock, ExternalLink } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { apiFetch } from '../lib/api';

interface VisitAnalyticsData {
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    todayVisits: number;
    activeNow: number;
    avgPagesPerSession: number;
    bounceRate: number;
  };
  topPages: { page: string; label: string; views: number; sharePct: number }[];
  devices: { name: string; value: number; color: string }[];
  sources: { source: string; visits: number }[];
  recentVisits: {
    id: string;
    timestamp: string;
    page: string;
    path: string;
    title: string;
    device: string;
    source: string;
    screen: string;
    language: string;
  }[];
}

interface VisitAnalyticsPanelProps {
  theme?: 'dark' | 'light';
}

export function VisitAnalyticsPanel({ theme = 'dark' }: VisitAnalyticsPanelProps) {
  const isDark = theme === 'dark';
  const [data, setData] = useState<VisitAnalyticsData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiFetch<{ success: boolean } & VisitAnalyticsData>(
          '/api/v1/admin/analytics/visits?period=30d'
        );
        if (res.success) setData(res);
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 25000);
    return () => clearInterval(id);
  }, []);

  const cardClass = 'ds-card p-5';

  const topPages = data?.topPages || [];
  const devices = data?.devices || [];
  const sources = data?.sources || [];
  const recentVisits = data?.recentVisits || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Grid 3 colunas: Páginas + Dispositivos + Origens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Páginas */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Páginas Mais Visitadas</h3>
            <span className="text-xs text-gray-400">
              {data?.summary?.avgPagesPerSession ?? 0} pág/sessão
            </span>
          </div>
          {topPages.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">
              Ainda sem visitas registadas. Navegue no portal para gerar telemetria.
            </p>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPages} layout="vertical" margin={{ top: 0, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}
                  />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={105}
                    tick={{ fill: isDark ? '#CBD5E1' : '#334155', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#14161A' : '#FFFFFF',
                      borderColor: isDark ? '#2A2E37' : '#E2E8F0',
                      borderRadius: '0px',
                      fontSize: '12px',
                      color: isDark ? '#F1F3F6' : '#0F172A',
                    }}
                  />
                  <Bar dataKey="views" name="Visualizações" fill="#0066FF" radius={[0, 6, 6, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Dispositivos */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Dispositivos</h3>
            <span className="text-xs text-gray-400">
              Rejeição: {data?.summary?.bounceRate ?? 0}%
            </span>
          </div>
          {devices.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Sem dados de dispositivos ainda.</p>
          ) : (
            <div className="flex flex-col items-center">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={70}
                      paddingAngle={4}
                    >
                      {devices.map((entry, idx) => (
                        <Cell key={`dev-${idx}`} fill={entry.color || '#0066FF'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#14161A' : '#FFFFFF',
                        borderColor: isDark ? '#2A2E37' : '#E2E8F0',
                        borderRadius: '0px',
                        fontSize: '12px',
                        color: isDark ? '#F1F3F6' : '#0F172A',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {devices.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-gray-400">{d.name}:</span>
                    <span className="font-mono font-bold">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Origens de Tráfego */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold">Origens de Tráfego</h3>
            <Globe className="h-4 w-4 text-sky-400" />
          </div>
          {sources.length === 0 ? (
            <p className="text-sm text-gray-400 py-10 text-center">Sem dados de origem ainda.</p>
          ) : (
            <div className="space-y-3 mt-2">
              {sources.map((s) => {
                const max = sources[0]?.visits || 1;
                const pct = Math.round((s.visits / max) * 100);
                return (
                  <div key={s.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.source}</span>
                      <span className="font-mono text-gray-400">{s.visits} visitas</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-[#1A1A1A]' : 'bg-slate-100'}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Visitas Recentes */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <h3 className="text-base font-bold">Monitoramento de Visitas em Tempo Real</h3>
          </div>
          <span className="text-xs text-gray-400">Últimas {recentVisits.length} visualizações</span>
        </div>

        {recentVisits.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Nenhuma visita registada até o momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${isDark ? 'border-[#1F1F1F] text-gray-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 pr-4 font-semibold">Hora</th>
                  <th className="py-2.5 pr-4 font-semibold">Página</th>
                  <th className="py-2.5 pr-4 font-semibold">Rota</th>
                  <th className="py-2.5 pr-4 font-semibold">Dispositivo</th>
                  <th className="py-2.5 pr-4 font-semibold">Origem</th>
                  <th className="py-2.5 font-semibold">Ecrã</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1A1A1A]' : 'divide-slate-100'}`}>
                {recentVisits.slice(0, 10).map((v) => (
                  <tr key={v.id} className={isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                    <td className="py-2.5 pr-4 font-mono text-gray-400 whitespace-nowrap">
                      {new Date(v.timestamp).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 pr-4 font-semibold">{v.title}</td>
                    <td className="py-2.5 pr-4 font-mono text-sky-400 flex items-center gap-1">
                      {v.path}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        {v.device === 'Mobile' ? (
                          <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                        ) : v.device === 'Tablet' ? (
                          <Tablet className="h-3.5 w-3.5 text-sky-400" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5 text-blue-400" />
                        )}
                        {v.device}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{v.source}</td>
                    <td className="py-2.5 font-mono text-gray-400">{v.screen || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
