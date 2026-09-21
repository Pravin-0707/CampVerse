import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/lib/api";
import { ClipboardCheck, Users, Building, CheckCircle2, RefreshCw, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/attendance")({ component: AdminAttendancePage });

function AdminAttendancePage() {
  const { user } = useAuth();
  const canTakeAttendance = user?.role === "admin" || user?.role === "professor";
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedCode, setSelectedCode] = useState("");
  const [presentCount, setPresentCount] = useState<number>(0);
  const [subject, setSubject] = useState("");

  const selectedRoom = classrooms.find((c) => c.code === selectedCode);

  const loadData = () => {
    setLoading(true);
    Promise.all([api.getClassrooms(), api.getAttendanceLogs()])
      .then(([classData, logData]) => {
        setClassrooms(classData);
        setLogs(logData);
        if (classData.length > 0 && !selectedCode) {
          setSelectedCode(classData[0].code);
          setPresentCount(classData[0].occupancy || 0);
          setSubject(classData[0].currentClass || "General Lecture");
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectClass = (code: string) => {
    setSelectedCode(code);
    const room = classrooms.find((c) => c.code === code);
    if (room) {
      setPresentCount(room.occupancy || 0);
      setSubject(room.currentClass || "General Lecture");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode) return;
    setSubmitting(true);

    try {
      const res = await api.recordAttendance({
        classroomCode: selectedCode,
        presentCount: Number(presentCount),
        subject,
      });
      toast.success(res.message || "Attendance recorded & occupancy calculated!");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record attendance");
    } finally {
      setSubmitting(false);
    }
  };

  // Preview calculations
  const capacity = selectedRoom?.capacity || 60;
  const calculatedOccupancy = Math.min(100, Math.round((presentCount / capacity) * 100));

  if (!canTakeAttendance) {
    return (
      <AppLayout>
        <GlassCard className="mx-auto max-w-xl p-8 text-center">
          <h1 className="text-xl font-semibold">Attendance access restricted</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Only professors and administrators can record attendance. Professors can submit new
            attendance once per classroom each day; only administrators can modify existing
            attendance.
          </p>
        </GlassCard>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> Admin · Take Attendance & Occupancy
            Calculation
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manually enter student attendance per classroom to automatically compute real-time class
            and building occupancy.
          </p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl bg-muted/40 border border-border/60 px-3 py-2 text-xs font-semibold flex items-center gap-1.5 hover:bg-muted/70 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Form Panel */}
        <GlassCard className="p-6 lg:col-span-1">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Mark Attendance
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Select Classroom
              </label>
              <select
                value={selectedCode}
                onChange={(e) => handleSelectClass(e.target.value)}
                className="w-full rounded-xl bg-background/60 border border-border/60 px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition font-medium"
              >
                {classrooms.map((c) => (
                  <option key={c._id || c.code} value={c.code}>
                    {c.code} — {c.building} (Cap: {c.capacity})
                  </option>
                ))}
              </select>
            </div>

            {selectedRoom && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Building:</span>
                  <span className="font-semibold text-foreground">{selectedRoom.building}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Capacity:</span>
                  <span className="font-semibold text-primary">{selectedRoom.capacity} seats</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Present Students Count
              </label>
              <input
                type="number"
                min={0}
                max={capacity}
                required
                value={presentCount}
                onChange={(e) => setPresentCount(Number(e.target.value))}
                className="w-full rounded-xl bg-background/60 border border-border/60 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Subject / Course Name
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Deep Learning — CS603"
                className="w-full rounded-xl bg-background/60 border border-border/60 px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
              />
            </div>

            {/* Calculated Preview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 via-background to-accent/15 border border-primary/30 text-center">
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                Calculated Student Occupancy
              </div>
              <div className="text-3xl font-extrabold text-primary">{calculatedOccupancy}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                {presentCount} / {capacity} Students Present (
                {presentCount > 0 ? "In Session" : "Free"})
              </div>
              <div className="w-full bg-muted/40 h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${calculatedOccupancy}%` }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedCode}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {submitting ? "Calculating & Saving..." : "Submit Manual Attendance"}
            </button>
          </form>
        </GlassCard>

        {/* Attendance Logs & Live Occupancies */}
        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Live Attendance Logs & Student
            Occupancies
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="pb-3 px-3">Classroom</th>
                  <th className="pb-3 px-3">Building</th>
                  <th className="pb-3 px-3">Subject</th>
                  <th className="pb-3 px-3">Present / Capacity</th>
                  <th className="pb-3 px-3">Occupancy %</th>
                  <th className="pb-3 px-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-muted/20 transition">
                    <td className="py-3 px-3 font-mono font-bold text-primary">
                      {log.classroomCode}
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">{log.buildingName}</td>
                    <td className="py-3 px-3 font-medium">{log.subject}</td>
                    <td className="py-3 px-3 font-mono">
                      {log.presentCount} / {log.totalCapacity}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">{log.occupancyPercentage}%</span>
                        <div className="w-16 bg-muted/40 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${log.occupancyPercentage > 75 ? "bg-rose-500" : log.occupancyPercentage > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${log.occupancyPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground">
                      {log.takenBy || "Admin"}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No attendance records submitted yet. Select a class on the left to submit
                      attendance.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
