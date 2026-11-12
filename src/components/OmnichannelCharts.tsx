import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const OMNICHANNEL_TRAFFIC_DATA = [
  { day: '28 Out', whatsapp: 28, forms: 12, email: 8 },
  { day: '29 Out', whatsapp: 34, forms: 15, email: 11 },
  { day: '30 Out', whatsapp: 42, forms: 19, email: 14 },
  { day: '31 Out', whatsapp: 39, forms: 16, email: 9 },
  { day: '01 Nov', whatsapp: 48, forms: 22, email: 17 },
  { day: '02 Nov', whatsapp: 31, forms: 14, email: 8 },
  { day: '03 Nov', whatsapp: 26, forms: 10, email: 6 },
  { day: '04 Nov', whatsapp: 52, forms: 27, email: 21 },
  { day: '05 Nov', whatsapp: 64, forms: 31, email: 24 },
  { day: '06 Nov', whatsapp: 58, forms: 29, email: 19 },
  { day: '07 Nov', whatsapp: 71, forms: 38, email: 26 },
  { day: '08 Nov', whatsapp: 66, forms: 34, email: 22 },
  { day: '09 Nov', whatsapp: 78, forms: 41, email: 29 },
  { day: 'Hoje', whatsapp: 84, forms: 46, email: 33 },
];

export const SERVICE_DEMAND_DATA = [
  { service: 'Faturação SAF-T', leads: 48, fill: '#0066FF' },
  { service: 'Agentes de IA', leads: 39, fill: '#38BDF8' },
  { service: 'Web & Mobile', leads: 31, fill: '#60A5FA' },
  { service: 'NOC & Redes 24/7', leads: 18, fill: '#818CF8' },
  { service: 'Gestão Escolar', leads: 24, fill: '#0284C7' },
];

export const CHANNEL_SHARE_DATA = [
  { name: 'WhatsApp Evolution', value: 58, color: '#10B981' },
  { name: 'Formulários Web', value: 26, color: '#0066FF' },
  { name: 'Email Profissional', value: 16, color: '#38BDF8' },
];

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0B132B]/95 p-3 shadow-2xl backdrop-blur-md text-xs">
        <p className="font-semibold text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((item: any) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name === 'whatsapp' ? 'WhatsApp' : item.name === 'forms' ? 'Formulários' : 'Email'}:
              </span>
              <span className="font-mono font-bold text-white">{item.value} msg</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function TrafficAreaChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={OMNICHANNEL_TRAFFIC_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradWa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradForms" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066FF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0066FF" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="gradEmail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="whatsapp"
            name="whatsapp"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradWa)"
          />
          <Area
            type="monotone"
            dataKey="forms"
            name="forms"
            stroke="#0066FF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradForms)"
          />
          <Area
            type="monotone"
            dataKey="email"
            name="email"
            stroke="#38BDF8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#gradEmail)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServiceDemandBarChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={SERVICE_DEMAND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis dataKey="service" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#0B132B]/95 p-2.5 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-semibold text-white">{data.service}</p>
                    <p className="text-sky-400 font-mono mt-1">{data.leads} propostas / pedidos</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="leads" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {SERVICE_DEMAND_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelShareDonut() {
  return (
    <div className="h-64 w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={CHANNEL_SHARE_DATA}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {CHANNEL_SHARE_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-white/10 bg-[#0B132B]/95 p-2.5 shadow-xl backdrop-blur-md text-xs">
                    <p className="font-semibold text-white">{data.name}</p>
                    <p className="text-emerald-400 font-mono mt-1">{data.value}% do volume total</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs text-slate-300 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}