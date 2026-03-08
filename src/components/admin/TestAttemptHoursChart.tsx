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
          Qaysi soatda nechta test boshlangan. Jami: {stats?.totalAttempts ?? 0} ta attempt.
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
      {stats?.dayDistribution && stats.dayDistribution.length > 0 && (
        <>
          <div className="mt-6 mb-2">
            <h4 className="text-sm font-semibold text-gray-800">
              Kun bo‘yicha (oxirgi 30 kun)
            </h4>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={stats.dayDistribution.slice(-14).map((d) => ({
                date: d.date.slice(5),
                count: d.count,
                fullDate: d.date,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number | undefined) => [`${value ?? 0} attempts`, "Count"]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate ?? ""}
              />
              <Bar dataKey="count" fill="#ea580c" name="Attempts" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </Card>
  );
}
