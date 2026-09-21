import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/analytics")({ component: Analytics });

const axis = { stroke: "oklch(0.68 0.03 250)", fontSize: 11 };

function Analytics() {
  const [analytics, setAnalytics] = useState<any>({
    occupancyByHour: [],
    buildingUsage: [],
    energyData: [],
  });

  useEffect(() => {
    api
      .getAnalytics()
      .then(setAnalytics)
      .catch((error) => console.error("Failed to load analytics", error));
  }, []);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live intelligence across occupancy, energy and footfall.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {[
          { k: "Peak Hour", v: "3:00 PM", s: "90% occupancy" },
          { k: "Available Rooms", v: "184", s: "of 420 total" },
          { k: "Energy Today", v: "512 kWh", s: "-4% vs yesterday" },
        ].map((m) => (
          <GlassCard key={m.k}>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.k}</div>
            <div className="text-2xl font-semibold mt-1">{m.v}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.s}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard>
          <h3 className="text-sm font-semibold mb-2">Occupancy by Hour</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics.occupancyByHour}>
              <defs>
                <linearGradient id="gOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.20 258)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="oklch(0.62 0.20 258)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="hour" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.035 260)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="oklch(0.62 0.20 258)"
                strokeWidth={2}
                fill="url(#gOcc)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard>
          <h3 className="text-sm font-semibold mb-2">Building Usage</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.buildingUsage}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="name" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.035 260)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="usage" fill="oklch(0.72 0.16 210)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h3 className="text-sm font-semibold mb-2">Energy Consumption</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.energyData}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.05)" vertical={false} />
              <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
              <YAxis {...axis} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.17 0.035 260)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="kwh"
                stroke="oklch(0.78 0.16 75)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
