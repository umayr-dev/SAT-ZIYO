"use client";

import { useEffect, useState } from "react";
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

interface HourDistribution {
  hour: number;
  count: number;
}

/**
 * Test Attempt Hours Chart Component
 * Shows distribution of test attempts by hour of day
 */
export default function TestAttemptHoursChart() {
  const [data, setData] = useState<HourDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const stats = await response.json();
          setData(stats.hourDistribution || []);
        }
      } catch (error) {
        console.error("Failed to fetch hour distribution:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  if (loading) {
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
            formatter={(value: number) => [`${value} attempts`, "Count"]}
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


