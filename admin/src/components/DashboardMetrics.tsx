import { Wallet, TrendingUp } from 'lucide-react';

interface DashboardMetricsProps {
  theme?: 'dark' | 'light';
}

export function DashboardMetrics({ theme = 'dark' }: DashboardMetricsProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`flex flex-col xl:flex-row gap-8 xl:items-center justify-between p-6 rounded-2xl border transition-all ${
        isDark
          ? 'bg-[#0D0D0D] border-[#1F1F1F] text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}
    >
      {/* Hero Metric */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <Wallet className="h-5 w-5 text-blue-500" />
          <span className="text-base font-medium">Faturação & Pipeline Global</span>
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#86efac]/10 text-[#86efac] border border-[#86efac]/20">
            <TrendingUp className="h-3 w-3" /> +30.46%
          </span>
        </div>
        <div className="text-4xl md:text-4xl lg:text-5xl font-bold font-mono tracking-tight text-inherit">
          Kz 27.850.000
        </div>
      </div>

      {/* 4 Finbro Submetrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 xl:gap-14">
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Pipeline Ativo</span>
          <span className="text-xl md:text-xl lg:text-2xl font-bold font-mono text-inherit">Kz 18.220.000</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Vendas Ganhas</span>
          <span className="text-xl md:text-xl lg:text-2xl font-bold font-mono text-[#86efac]">+Kz 9.630.000</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Conversão Funil</span>
          <span className="text-xl md:text-xl lg:text-2xl font-bold font-mono text-[#86efac]">+68.4%</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">Faturado Hoje (24h)</span>
          <span className="text-xl md:text-xl lg:text-2xl font-bold font-mono text-[#86efac]">+Kz 1.450.000</span>
        </div>
      </div>
    </div>
  );
}
