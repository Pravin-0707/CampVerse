import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/events")({ component: Events });

const typeColor: Record<string, string> = {
  Seminar: "text-primary bg-primary/15",
  Hackathon: "text-accent bg-accent/15",
  Placement: "text-[color:var(--success)] bg-[color:var(--success)]/15",
  Workshop: "text-[color:var(--warning)] bg-[color:var(--warning)]/15",
};

function Events() {
  const { user } = useAuth();
  const canCreate = user?.role === "admin" || user?.role === "professor";
  const canManage = user?.role === "admin";
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    date: "",
    location: "",
    type: "Seminar",
    seats: "100",
    visibility: "public",
  });

  useEffect(() => {
    api
      .getEvents()
      .then(setEvents)
      .catch((error) => console.error("Failed to load events", error));
  }, []);

  const saveEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const payload = { ...form, seats: Number(form.seats) };
      if (editingId) {
        const updated = await api.updateEvent(editingId, payload);
        setEvents((current) => current.map((item) => (item._id === editingId ? updated : item)));
        toast.success("Event updated successfully");
      } else {
        const created = await api.createEvent(payload);
        setEvents((current) => [created, ...current]);
        toast.success("Event created successfully");
      }
      setEditingId(null);
      setForm({
        name: "",
        date: "",
        location: "",
        type: "Seminar",
        seats: "100",
        visibility: "public",
      });
    } catch (error: any) {
      toast.error(error.message || "Unable to create event");
    }
  };

  const editEvent = (event: any) => {
    setEditingId(event._id);
    setForm({
      name: event.name,
      date: event.date,
      location: event.location,
      type: event.type || "Seminar",
      seats: String(event.seats || 100),
      visibility: event.visibility || "public",
    });
  };

  const deleteEvent = async (id: string) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.deleteEvent(id);
      setEvents((current) => current.filter((event) => event._id !== id));
      toast.success("Event deleted");
    } catch (error: any) {
      toast.error(error.message || "Unable to delete event");
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upcoming seminars, hackathons and workshops.
          </p>
        </div>
        <button className="rounded-xl border border-border/50 bg-white/[0.03] px-3 py-2 text-xs inline-flex items-center gap-2 hover:bg-white/[0.06]">
          <CalendarDays className="h-4 w-4" /> Calendar View
        </button>
      </div>

      {canCreate && (
        <GlassCard className="mb-6 p-5">
          <h2 className="text-sm font-semibold mb-3">
            {editingId ? "Edit Event" : "Create Event"}
          </h2>
          <form onSubmit={saveEvent} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              required
              placeholder="Event name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Date and time"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            />
            <input
              required
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            >
              <option>Seminar</option>
              <option>Workshop</option>
              <option>Hackathon</option>
              <option>Placement</option>
            </select>
            <input
              type="number"
              min="1"
              placeholder="Seats"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            />
            <select
              value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value })}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-sm"
            >
              <option value="public">Public - guests can view</option>
              <option value="private">Private - campus users only</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:col-span-3"
            >
              {editingId ? "Update Event" : "Publish Event"}
            </button>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e, i) => (
          <GlassCard key={e.name} hoverable transition={{ delay: i * 0.05 }}>
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${typeColor[e.type]}`}
                >
                  {e.type}
                </span>
                <h3 className="text-lg font-semibold mt-2">{e.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {e.date} · {e.location} · {e.seats} seats
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold gradient-text">{e.date.split(" ")[1]}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {e.date.split(" ")[0]}
                </div>
              </div>
            </div>
            {canManage && (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => editEvent(e)}
                  className="rounded-lg border border-primary/40 px-3 py-1.5 text-xs text-primary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteEvent(e._id)}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive"
                >
                  Delete
                </button>
              </div>
            )}
          </GlassCard>
        ))}
      </div>
    </AppLayout>
  );
}
