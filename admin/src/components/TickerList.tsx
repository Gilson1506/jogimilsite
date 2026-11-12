import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface TickerListProps {
  theme?: 'dark' | 'light';
}

const data = [
  {
    id: 'ALVALADE',
    name: 'Supermercado Alvalade (POS SAF-T)',
    ticker: 'POS-01',
    qty: 3,
    price: '1.280.000 Kz',
    invested: '2.560.000 Kz',
    current: '3.850.000 Kz',
    returns: 21.73,
    trend: 'up',
    chartData: [
      { value: 100 },
      { value: 110 },
      { value: 105 },
      { value: 115 },
      { value: 125 },
      { value: 120 },
      { value: 130 },
      { value: 140 },
      { value: 135 },
      { value: 145 },
      { value: 150 },
    ],
  },
  {
    id: 'MILENIO',
    name: 'Complexo Escolar Milénio (Cloud)',
    ticker: 'EDU-AO',
    qty: 1,
    price: '5.200.000 Kz',
    invested: '3.600.000 Kz',
    current: '5.200.000 Kz',
    returns: 44.44,
    trend: 'up',
    chartData: [
      { value: 100 },
      { value: 108 },
      { value: 118 },
      { value: 125 },
      { value: 130 },
      { value: 135 },
      { value: 140 },
      { value: 142 },
      { value: 148 },
      { value: 155 },
      { value: 160 },
    ],
  },
  {
    id: 'LOGISTICA',
    name: 'Logística & Navegação Luanda (IA)',
    ticker: 'LOG-AI',
    qty: 2,
    price: '3.900.000 Kz',
    invested: '4.200.000 Kz',
    current: '7.800.000 Kz',
    returns: 85.71,
    trend: 'up',
    chartData: [
      { value: 110 },
      { value: 125 },
      { value: 130 },
      { value: 145 },
      { value: 150 },
      { value: 165 },
      { value: 175 },
      { value: 180 },
      { value: 195 },
      { value: 200 },
      { value: 210 },
    ],
  },
  {
    id: 'CLINICA',
    name: 'Clínica Sagrada Esperança (Agendamento)',
    ticker: 'MED-AO',
    qty: 1,
    price: '4.100.000 Kz',
    invested: '4.500.000 Kz',
    current: '4.100.000 Kz',
    returns: -8.88,
    trend: 'down',
    chartData: [
      { value: 150 },
      { value: 145 },
      { value: 140 },
      { value: 135 },
      { value: 130 },
      { value: 125 },
      { value: 130 },
      { value: 120 },
      { value: 115 },
      { value: 110 },
      { value: 105 },
    ],
  },
];

export function TickerList({ theme = 'dark' }: TickerListProps) {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border p-6 overflow-x-auto transition-all ${
        isDark
          ? 'bg-[#0D0D0D] border-[#1F1F1F] text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">Oportunidades & Contratos Recentes</h3>
          <p className="text-xs text-gray-400">Monitorização em tempo real de contas corporativas em Angola</p>
        </div>
        <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
          Kz (AOA) Luanda
        </span>
      </div>

      <table className="w-full min-w-[700px] text-xs">
        <thead>
          <tr className="text-gray-400 border-b border-inherit">
            <th className="pb-3 text-left font-semibold pl-2">
              <div className="flex items-center gap-1 cursor-pointer hover:text-inherit transition-colors">
                Empresa / Solução
                <ChevronsUpDown className="h-3.5 w-3.5" />
              </div>
            </th>
            <th className="pb-3 text-left font-semibold w-[110px]">Tendência</th>
            <th className="pb-3 text-right font-semibold">Caixas/Lic.</th>
            <th className="pb-3 text-right font-semibold">Valor Unitário</th>
            <th className="pb-3 text-right font-semibold">Investimento</th>
            <th className="pb-3 text-right font-semibold">Valor Total</th>
            <th className="pb-3 text-right font-semibold pr-2">Margem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-inherit">
          {data.map((item) => (
            <tr
              key={item.id}
              className={`group transition-colors ${
                isDark ? 'hover:bg-[#1A1A1A]' : 'hover:bg-slate-50'
              }`}
            >
              <td className="py-3.5 pl-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold text-[10px]">
                    {item.ticker.slice(0, 3)}
                  </div>
                  <div>
                    <span className="font-bold text-inherit block">{item.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{item.ticker}</span>
                  </div>
                </div>
              </td>
              <td className="py-3.5">
                <div className="h-8 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.chartData}>
                      <defs>
                        <linearGradient id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={item.trend === 'up' ? '#10B981' : '#EF4444'}
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="100%"
                            stopColor={item.trend === 'up' ? '#10B981' : '#EF4444'}
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={item.trend === 'up' ? '#10B981' : '#EF4444'}
                        strokeWidth={1.5}
                        fill={`url(#gradient-${item.id})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </td>
              <td className="py-3.5 text-right font-mono font-medium">{item.qty}</td>
              <td className="py-3.5 text-right font-mono text-gray-400">{item.price}</td>
              <td className="py-3.5 text-right font-mono text-gray-400">{item.invested}</td>
              <td className="py-3.5 text-right font-mono font-bold text-inherit">{item.current}</td>
              <td className="py-3.5 text-right pr-2">
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.trend === 'up'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {item.trend === 'up' ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(item.returns)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
