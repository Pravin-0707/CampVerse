import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/lib/api";
import { Building2, Users, Layers, Wifi, Snowflake, Monitor, Airplay, Cpu } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/buildings")({ component: Buildings });

const statusStyles: Record<string, string> = {
  Open: "bg-[color:var(--success)]/15 text-[color:var(--success)] border-[color:var(--success)]/30",
  Closed: "bg-destructive/15 text-destructive border-destructive/30",
  Maintenance:
    "bg-[color:var(--warning)]/15 text-[color:var(--warning)] border-[color:var(--warning)]/30",
};

const facilityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Projector: Airplay,
  AC: Snowflake,
  "Smart Board": Monitor,
  WiFi: Wifi,
  Computers: Cpu,
};

function Buildings() {
  const [open, setOpen] = useState(false);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any | null>(null);

  useEffect(() => {
    api
      .getBuildings()
      .then(setBuildings)
      .catch((error) => console.error("Failed to load buildings", error));
  }, []);
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Building Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {buildings.length} campus locations · Real-time occupancy and status
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {buildings.map((b, i) => (
          <GlassCard
            key={b.id}
            hoverable
            className="p-0 overflow-hidden"
            transition={{ delay: i * 0.05 }}
            onClick={() => {
              setSelectedBuilding(b);
              setOpen(true);
            }}
          >
            <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/30 via-card to-accent/20">
              {b.image ? (
                <img
                  src={b.image}
                  alt={b.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Building2 className="h-14 w-14 text-primary/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <span
                className={`absolute top-3 right-3 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusStyles[b.status]}`}
              >
                {b.status}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-base font-semibold">{b.name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {b.departments.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] rounded-full bg-white/[0.05] border border-border/40 px-2 py-0.5 text-muted-foreground"
                  >
                    {d}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> {b.floors} floors
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> {b.occupancy}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${b.occupancy}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl glass-strong border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />{" "}
              {selectedBuilding?.name || "Campus location"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
            <Info
              label="Departments"
              value={(selectedBuilding?.departments || []).join(", ") || "Not specified"}
            />
            <Info label="Floors" value={String(selectedBuilding?.floors ?? "Not specified")} />
            <Info label="Occupancy" value={`${selectedBuilding?.occupancy ?? 0}%`} />
            <Info label="Status" value={selectedBuilding?.status || "Unknown"} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 mt-2">
              Facilities
            </div>
            <div className="flex flex-wrap gap-2">
              {(selectedBuilding?.facilities || []).map((f: string) => {
                const Icon = facilityIcons[f] ?? Wifi;
                return (
                  <span
                    key={f}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-white/[0.04] px-3 py-1 text-xs"
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" /> {f}
                  </span>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-white/[0.03] px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
