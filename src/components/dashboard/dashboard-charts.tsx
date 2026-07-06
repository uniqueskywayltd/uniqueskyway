"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/design-system/empty-state";
import { TrendingUp } from "lucide-react";

type ChartPoint = { date: string; value: number; label?: string };
type AllocationPoint = { name: string; value: number };

type ChartProps = {
  data: ChartPoint[];
  loading?: boolean;
  error?: string | null;
};

type AllocationProps = {
  data: AllocationPoint[];
  loading?: boolean;
  error?: string | null;
};

const COLORS = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b"];

function ChartShell({
  title,
  loading,
  error,
  children,
  emptyTitle,
  hasData,
}: {
  title: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  emptyTitle: string;
  hasData: boolean;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {loading ? (
          <div className="flex h-full items-center justify-center" aria-busy="true">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : error ? (
          <EmptyState
            title="Chart unavailable"
            description={error}
            icon={<TrendingUp className="h-5 w-5" />}
            className="border-0 bg-transparent py-8"
          />
        ) : !hasData ? (
          <ChartEmpty title={emptyTitle} />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

function ChartEmpty({ title }: { title: string }) {
  return (
    <EmptyState
      title="No data yet"
      description={`${title} will appear once you have account activity.`}
      icon={<TrendingUp className="h-5 w-5" />}
      className="border-0 bg-transparent py-8"
    />
  );
}

export function PortfolioGrowthChart({ data, loading, error }: ChartProps) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <ChartShell title="Portfolio growth" loading={loading} error={error} emptyTitle="Portfolio growth" hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Portfolio"]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Area type="monotone" dataKey="value" stroke="#6366f1" fill="url(#growthGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function BalanceHistoryChart({ data, loading, error }: ChartProps) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <ChartShell title="Balance history" loading={loading} error={error} emptyTitle="Balance history" hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Balance"]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#balanceGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function EarningsTrendChart({ data, loading, error }: ChartProps) {
  const hasData = data.some((d) => d.value > 0);

  return (
    <ChartShell title="Earnings trend" loading={loading} error={error} emptyTitle="Earnings trend" hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) =>
              new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            }
          />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value) => [`$${Number(value ?? 0).toFixed(2)}`, "Earnings"]}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function AllocationChart({ data, loading, error }: AllocationProps) {
  const hasData = data.length > 0;

  return (
    <ChartShell title="Investment distribution" loading={loading} error={error} emptyTitle="Investment distribution" hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${Number(value ?? 0).toFixed(2)}`} />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
