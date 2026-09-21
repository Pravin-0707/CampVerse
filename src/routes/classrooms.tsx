import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { DoorOpen, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/classrooms")({ component: Classrooms });

function Classrooms() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api
      .getClassrooms()
      .then(setClassrooms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Classrooms Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time student occupancies calculated from manual attendance logs.
          </p>
        </div>
        {user?.role === "admin" && (
          <Link
            to="/admin/attendance"
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground flex items-center gap-1.5 shadow"
          >
            <ClipboardCheck className="h-4 w-4" /> Take Attendance
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classrooms.map((r, i) => {
          const occPct = r.capacity ? Math.round(((r.occupancy || 0) / r.capacity) * 100) : 0;
          return (
            <GlassCard
              key={r._id || r.code}
              hoverable
              transition={{ delay: i * 0.03 }}
              className="p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <DoorOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold font-mono text-primary">{r.code}</div>
                    <div className="text-[11px] text-muted-foreground">{r.building}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border ${r.status === "Free" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-primary/15 text-primary border-primary/30"}`}
                >
                  {r.status || "Free"}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Students Present</span>
                <span className="font-bold text-foreground">
                  {r.occupancy || 0} / {r.capacity} ({occPct}%)
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${occPct}%` }}
                />
              </div>
            </GlassCard>
          );
        })}
      </div>
    </AppLayout>
  );
}
