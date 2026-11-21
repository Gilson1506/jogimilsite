import { useEffect, useState } from 'react';
import { Download, Eye, Users, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { apiFetch } from '../lib/api';
import { BrandLoader } from './BrandLoader';

interface TimelinePoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
}

interface VisitAnalyticsResponse {
  success: boolean;
  period: string;
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    todayVisits: number;
    activeNow: number;
    growthPct: number;
  };
  timeline: TimelinePoint[];
}

interface PerformanceChartProps {
  theme?: 'dark' | 'light';
}

const PERIOD_MAP: Record<string, string> = {
  '24H': '24h',
  '7D': '7d',
  '30D': '30d',
  '90D': '90d',
  '1Y': '1y',
};

export function PerformanceChart({ theme = 'dark' }: PerformanceChartProps) {
  const isDark = theme === 'dark';
  const [selectedPeriod, setSelectedPeriod] = useState('30D');
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [summary, setSummary] = useState<VisitAnalyticsResponse['summary'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const q = PERIOD_MAP[selectedPeriod] || '30d';
        const res = await apiFetch<VisitAnalyticsResponse>(`/api/v1/admin/analytics/visits?period=${q}`);
        if (active && res.success) {
          setTimeline(res.timeline || []);
          setSummary(res.summary || null);
        }
      } catch {
        // fallback empty
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [selectedPeriod]);

  const handleExportCsv = () => {
    const header = 'Periodo,Visitas Totais,Visitantes Unicos\n';
    const rows = timeline.map((t) => `"${t.date}",${t.visits},${t.uniqueVisitors}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jogimil-visitas-${selectedPeriod.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ds-card flex flex-col gap-5 p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap pb-4 border-b ds-divider">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="ds-title">Tráfego & Monitoramento de Visitas</h2>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono ds-muted">
            <Eye className="w-3.5 h-3.5 text-brand" />
            <strong className="text-[rgb(var(--text))]">{summary?.totalVisits ?? 0}</strong> visitas
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono ds-muted">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <strong className="text-[rgb(var(--text))]">{summary?.uniqueVisitors ?? 0}</strong> únicos
          </span>
          {summary && (
            <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-emerald-500">
              <TrendingUp className="w-3.5 h-3.5" />
              {summary.growthPct >= 0 ? `+${summary.growthPct}%` : `${summary.growthPct}%`}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border ds-divider ds-surface-2">
            {Object.keys(PERIOD_MAP).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold transition-colors ${
                  selectedPeriod === period
                    ? 'bg-brand text-white'
                    : 'ds-muted hover:text-[rgb(var(--text))]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="btn btn-secondary btn-sm"
            title="Descarregar relatório CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      <div className="h-[340px] w-full">
        {loading && timeline.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <BrandLoader size="md" theme={theme} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0066FF" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0066FF" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)'}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? '#14161A' : '#FFFFFF',
                  borderColor: isDark ? '#2A2E37' : '#E2E8F0',
                  borderRadius: '0px',
                  fontSize: '12px',
                  color: isDark ? '#F1F3F6' : '#0F172A',
                  boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.6)' : '0 8px 20px rgba(15,23,42,0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              <Area
                type="monotone"
                dataKey="visits"
                name="Visitas Totais"
                stroke="#0066FF"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorVisits)"
              />
              <Area
                type="monotone"
                dataKey="uniqueVisitors"
                name="Visitantes Únicos"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUnique)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
