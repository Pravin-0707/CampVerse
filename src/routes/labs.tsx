import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { FlaskConical } from "lucide-react";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/labs")({ component: Labs });

function Labs() {
  const [labs, setLabs] = useState<any[]>([]);

  useEffect(() => {
    api
      .getLabs()
      .then(setLabs)
      .catch((error) => console.error("Failed to load labs", error));
  }, []);
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Campus Labs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live location and availability of all campus labs.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map((l, i) => (
          <GlassCard key={l.name} hoverable transition={{ delay: i * 0.04 }}>
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <FlaskConical className="h-5 w-5" />
              </div>
              <span className="text-[11px] rounded-full border border-border/50 bg-white/[0.03] px-2 py-0.5">
                {l.status}
              </span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{l.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {l.building}, Floor {l.floor}
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              Occupancy:{" "}
              <span className="text-foreground font-mono">
                {l.occupancy} / {l.capacity}
              </span>
            </div>
          </GlassCard>
        ))}
      </div>
    </AppLayout>
  );
}
