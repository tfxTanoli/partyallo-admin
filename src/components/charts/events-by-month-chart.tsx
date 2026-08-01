import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { ChartLegend, ChartTooltip } from './chart-tooltip';
import type { MonthlyEventPoint } from '@/types';

const SERIES = [
  { key: 'complete', label: 'Complete', color: 'var(--chart-complete)' },
  { key: 'inProgress', label: 'In progress', color: 'var(--chart-in-progress)' },
] as const;

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entries = SERIES.map((series) => ({
    key: series.key,
    label: series.label,
    color: series.color,
    value: Number(payload.find((item) => item.dataKey === series.key)?.value ?? 0),
  }));

  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <ChartTooltip
      title={String(label)}
      entries={entries}
      footer={`${total} ${total === 1 ? 'event' : 'events'} in total`}
    />
  );
}

export function EventsByMonthChart({ data }: { data: MonthlyEventPoint[] }) {
  return (
    <div className="space-y-4">
      <ChartLegend items={SERIES.map(({ label, color }) => ({ label, color }))} />

      <div className="h-[17.5rem] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 6, bottom: 0, left: -14 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              allowDecimals={false}
              tickMargin={4}
            />
            <Tooltip
              content={CustomTooltip}
              cursor={{ fill: 'color-mix(in srgb, currentColor 6%, transparent)' }}
            />
            {SERIES.map((series, index) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                name={series.label}
                stackId="events"
                fill={series.color}
                // 2px surface gap between stacked segments; only the top is rounded.
                stroke="var(--card)"
                strokeWidth={2}
                radius={index === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
                maxBarSize={34}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
