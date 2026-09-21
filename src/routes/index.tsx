import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { ViewerPlaceholder } from "@/components/ViewerPlaceholder";
import { Bell, MapPin, Trophy, CalendarClock, Briefcase, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({ component: Dashboard });

const announcementIcons = [Trophy, CalendarClock, Briefcase];

function Dashboard() {
  const { user } = useAuth();
  const canTakeAttendance = user?.role === "admin" || user?.role === "professor";
  const canViewAttendance =
    user?.role === "admin" || user?.role === "professor" || user?.role === "student";
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ avgBuildingOccupancy: 0, buildingUsage: [] });

  const occupancyData = [
    {
      name: "High",
      value: analytics.buildingUsage.filter((b: any) => b.usage >= 70).length,
      color: "oklch(0.62 0.24 25)",
    },
    {
      name: "Moderate",
      value: analytics.buildingUsage.filter((b: any) => b.usage >= 30 && b.usage < 70).length,
      color: "oklch(0.78 0.16 75)",
    },
    {
      name: "Low",
      value: analytics.buildingUsage.filter((b: any) => b.usage < 30).length,
      color: "oklch(0.72 0.17 155)",
    },
  ];
  const totalBuildings = occupancyData.reduce((sum, item) => sum + item.value, 0);
  const upcomingClasses = classrooms.filter((room) => room.currentClass).slice(0, 3);

  useEffect(() => {
    Promise.all([
      canViewAttendance ? api.getAttendanceLogs() : Promise.resolve([]),
      api.getAnnouncements(),
      api.getEvents(),
      api.getClassrooms(),
      api.getAnalytics(),
    ])
      .then(([attendance, notices, eventData, roomData, analyticsData]) => {
        setAttendanceLogs(attendance);
        setAnnouncements(notices);
        setEvents(eventData);
        setClassrooms(roomData);
        setAnalytics(analyticsData);
      })
      .catch(() => {});
  }, [canViewAttendance]);

  return (
    <AppLayout>
      <div className="mb-4 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Campus Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live intelligence across every building, calculated in real time via manual attendance.
          </p>
        </div>
      </div>

      {/* Hero viewer */}
      <ViewerPlaceholder height="h-[420px]" label="Main Campus · Live Twin" />

      {/* Bottom widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
        {/* Occupancy donut */}
        {canViewAttendance && (
          <GlassCard className="p-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              Occupancy Status
            </div>
            <div className="relative h-40 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    innerRadius={44}
                    outerRadius={62}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {occupancyData.map((e) => (
                      <Cell key={e.name} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-2xl font-bold">{analytics.avgBuildingOccupancy ?? 0}%</div>
                <div className="text-[10px] text-muted-foreground">Occupied</div>
              </div>
            </div>
            <div className="space-y-1 mt-2">
              {occupancyData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-muted-foreground">
                    {totalBuildings ? Math.round((d.value / totalBuildings) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Upcoming Classes */}
        <GlassCard className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Upcoming Classes
          </div>
          <div className="space-y-2.5">
            {upcomingClasses.slice(0, 3).map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{c.subject}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.building || "Campus classroom"}
                  </div>
                </div>
                <span className="text-[11px] font-mono text-primary shrink-0">{c.code}</span>
              </motion.div>
            ))}
          </div>
          <Link
            to="/classrooms"
            className="mt-3 inline-block text-[11px] text-primary hover:underline"
          >
            View Classrooms ›
          </Link>
        </GlassCard>

        {/* Manual Attendance & Occupancy Calculation Widget */}
        <GlassCard className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="h-3.5 w-3.5 text-primary" /> Attendance Occupancy
            </span>
            {canTakeAttendance && (
              <Link to="/admin/attendance" className="text-primary hover:underline text-[10px]">
                Take Attendance
              </Link>
            )}
          </div>
          <div className="space-y-2.5">
            {attendanceLogs.length > 0 ? (
              attendanceLogs.slice(0, 3).map((log, i) => (
                <motion.div
                  key={log._id || i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between border-b border-border/30 pb-2 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="text-xs font-semibold">{log.classroomCode}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {log.presentCount}/{log.totalCapacity} present
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">
                    {log.occupancyPercentage}% occ
                  </span>
                </motion.div>
              ))
            ) : (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No manual attendance recorded today. <br />
                {canTakeAttendance ? (
                  <Link
                    to="/admin/attendance"
                    className="text-primary font-semibold hover:underline mt-1 inline-block"
                  >
                    Record Attendance Now
                  </Link>
                ) : (
                  <span className="text-[10px]">Administrator access required.</span>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Announcements */}
        <GlassCard className="p-4">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Bell className="h-3 w-3" /> Campus Announcements
          </div>
          <div className="space-y-2.5">
            {[
              ...announcements,
              ...events.map((event) => ({
                title: event.name,
                time: event.date,
                tag: event.visibility === "private" ? "Private event" : "Public event",
              })),
            ]
              .slice(0, 5)
              .map((a, i) => {
                const Icon = announcementIcons[i] ?? MapPin;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-3 border-b border-border/30 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/15 text-accent shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold leading-tight">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {a.time} · {a.tag}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
          <Link to="/events" className="mt-3 inline-block text-[11px] text-primary hover:underline">
            View Events ›
          </Link>
        </GlassCard>
      </div>
    </AppLayout>
  );
}
