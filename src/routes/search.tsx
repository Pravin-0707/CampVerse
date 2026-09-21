import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import {
  Search as SearchIcon,
  DoorOpen,
  FlaskConical,
  Building2,
  Users,
  CalendarDays,
  Coffee,
  Library,
  Car,
  Bus,
} from "lucide-react";
import { useState } from "react";

import { VERIFIED_CAMPUS_LOCATIONS } from "@/lib/campus-locations";

export const Route = createFileRoute("/search")({ component: SearchPage });

const verifiedLocationItems = VERIFIED_CAMPUS_LOCATIONS.map((loc) => ({
  icon: Building2,
  cat: loc.type === "facility" ? "Facility" : loc.type === "gate" ? "Gate" : "Building",
  name: loc.name,
  meta: `Campus location · ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`,
}));

const items = [
  ...verifiedLocationItems,
  {
    icon: FlaskConical,
    cat: "Lab",
    name: "Alankay, Niklauswirth Lab",
    meta: "CSE BLOCK Ground floor",
  },
  { icon: FlaskConical, cat: "Lab", name: "Dijkstra, Donald Lab", meta: "CSE BLOCK 1st floor" },
  { icon: FlaskConical, cat: "Lab", name: "Edger F Codd Lab", meta: "MCT/ECE 1st floor" },
  { icon: FlaskConical, cat: "Lab", name: "Advanced Automation Lab", meta: "MCT/ECE 2nd floor" },
  { icon: FlaskConical, cat: "Lab", name: "DSP Lab", meta: "MCT/ECE 2nd floor" },
  { icon: FlaskConical, cat: "Lab", name: "Jim Gray Lab (JIMGREY)", meta: "MCT/ECE 2nd floor" },
  {
    icon: FlaskConical,
    cat: "Lab",
    name: "CAM Lab (James Truchard Lab MC 03)",
    meta: "MCT ground floor left corner",
  },
  { icon: FlaskConical, cat: "Lab", name: "C4 2nd Floor Lab 1,2", meta: "C4 Block 2nd floor" },
  { icon: FlaskConical, cat: "Lab", name: "Peterchen Lab", meta: "MCA Block 2nd floor" },
  { icon: FlaskConical, cat: "Lab", name: "CAR Hoare Lab", meta: "MCA Block 2nd floor" },
  { icon: FlaskConical, cat: "Lab", name: "Linus Torvalds Lab", meta: "MBA Block 2nd floor" },
  {
    icon: FlaskConical,
    cat: "Lab",
    name: "Digital Library (Civil Lab & Mech Lab)",
    meta: "Library 1st floor",
  },
  { icon: DoorOpen, cat: "Classroom", name: "C3-05 · AI Lab", meta: "C3 Block · Floor 3" },
  { icon: Users, cat: "Faculty", name: "Dr. Anjali Rao", meta: "Computer Science · Room 3-12" },
  { icon: CalendarDays, cat: "Event", name: "AI Summit 2026", meta: "Jul 28 · Seminar Hall" },
  { icon: Coffee, cat: "Cafeteria", name: "North Wing Café", meta: "Open · 08:00–22:00" },
  { icon: Car, cat: "Parking", name: "Parking Lot B", meta: "128 / 240 available" },
  { icon: Bus, cat: "Transport", name: "Shuttle Route R-01", meta: "Campus Gate → Hostel · 3 min" },
];

function SearchPage() {
  const [q, setQ] = useState("");
  const filtered = q
    ? items.filter((i) => (i.name + i.cat + i.meta).toLowerCase().includes(q.toLowerCase()))
    : items;

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-center">Search the Campus</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Rooms, buildings, faculty, events, transport — everything.
        </p>

        <div className="relative mt-6">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try 'Dijkstra', 'Linus Torvalds', 'CAM Lab'..."
            className="w-full rounded-2xl border border-border/50 bg-white/[0.04] pl-12 pr-4 py-4 text-base placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {["Classroom", "Lab", "Building", "Event", "Transport"].map((c) => (
            <button
              key={c}
              onClick={() => setQ(c)}
              className="text-[11px] rounded-full border border-border/50 bg-white/[0.03] px-2.5 py-1 text-muted-foreground hover:text-foreground"
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {filtered.map((r, i) => (
            <GlassCard key={i} hoverable className="p-4" transition={{ delay: i * 0.03 }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <r.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground">{r.meta}</div>
                </div>
                <span className="text-[10px] rounded-full border border-border/50 bg-white/[0.03] px-2 py-0.5 text-muted-foreground">
                  {r.cat}
                </span>
              </div>
            </GlassCard>
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              No results for "{q}"
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
