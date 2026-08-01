import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { ChartTooltip } from './chart-tooltip';
import type { UserGrowthPoint } from '@/types';

/**
 * One measure, one axis: the area is the cumulative user total. Monthly sign-ups
 * live in the tooltip rather than on a second y-scale.
 */
function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0]?.payload as UserGrowthPoint | undefined;
  if (!point) return null;

  return (
    <ChartTooltip
      title={String(label)}
      entries={[
        { key: 'total', label: 'Total users', value: point.total, color: 'var(--chart-users)' },
      ]}
      footer={`${point.newUsers} joined this month`}
    />
  );
}

export function UsersGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  return (
    <div className="h-[17.5rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 6, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="users-growth-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-users)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-users)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
          <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} tickMargin={4} />
          <Tooltip
            content={CustomTooltip}
            cursor={{ stroke: 'var(--chart-users)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />

          <Area
            type="monotone"
            dataKey="total"
            name="Total users"
            stroke="var(--chart-users)"
            strokeWidth={2}
            fill="url(#users-growth-fill)"
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--card)' }}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
