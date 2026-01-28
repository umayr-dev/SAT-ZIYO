"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card } from "@/src/ui/card";
import { Loading } from "@/src/ui/loading";
import { useAdminStats } from "@/src/components/admin/useAdminStats";

/**
 * Test Attempt Hours Chart Component
 * Shows distribution of test attempts by hour of day.
 *
 * Uses the shared admin stats hook so we don't re-fetch /api/admin/stats
 * separately from other widgets.
 */
export default function TestAttemptHoursChart() {
  const { data: stats, isLoading } = useAdminStats();
  const data = stats?.hourDistribution ?? [];

  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM";
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return "12 PM";
    return `${hour - 12} PM`;
  };

  const chartData = data.map((item) => ({
    hour: formatHour(item.hour),
    hourValue: item.hour,
    count: item.count,
  }));

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loading size="sm" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Test Attempts by Hour
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Distribution of when users start taking tests throughout the day
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="hour"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number | undefined) => [
              `${value ?? 0} attempts`,
              "Count",
            ]}
            labelFormatter={(label) => `Hour: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="count"
            fill="#f97316"
            name="Test Attempts"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
