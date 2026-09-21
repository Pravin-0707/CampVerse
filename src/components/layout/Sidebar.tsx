import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Compass,
  Building2,
  GraduationCap,
  FlaskConical,
  DoorOpen,
  CalendarDays,
  BarChart3,
  Settings,
  Zap,
  Shield,
  LogIn,
  LogOut,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const items = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/search", icon: Search, label: "Search" },
  { to: "/navigation", icon: Compass, label: "Routes" },
  { to: "/classrooms", icon: DoorOpen, label: "Classrooms" },
  { to: "/labs", icon: FlaskConical, label: "Labs" },
  { to: "/buildings", icon: Building2, label: "Buildings" },
  { to: "/departments", icon: GraduationCap, label: "Departments" },
  { to: "/events", icon: CalendarDays, label: "Events" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/50 bg-sidebar/70 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border/40">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground glow">
          <Zap className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-bold tracking-tight uppercase">Smart Campus</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">Digital Twin</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/40"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon className={cn("relative h-4 w-4", active && "text-primary")} />
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}

        {/* Admin Navigation Section */}
        {(user?.role === "admin" || user?.role === "professor") && (
          <div className="pt-4 mt-4 border-t border-border/40 space-y-1">
            <div className="px-3 text-[10px] uppercase tracking-wider font-semibold text-primary mb-1 flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> Admin Controls
            </div>
            <Link
              to="/admin/attendance"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition",
                pathname === "/admin/attendance"
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}
            >
              <ClipboardCheck className="h-4 w-4 text-primary" /> Take Attendance
            </Link>
            <Link
              to="/admin/buildings"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition",
                pathname === "/admin/buildings"
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
              )}
            >
              <Building2 className="h-4 w-4 text-primary" /> Manage Buildings
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-border/40 space-y-2">
        {user ? (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 justify-center rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 p-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out ({user.name})
          </button>
        ) : (
          <div className="space-y-2">
            <div className="rounded-xl border border-border/50 bg-white/[0.03] px-3 py-2 text-center">
              <div className="text-sm font-semibold">Guest User</div>
              <div className="text-[10px] text-muted-foreground">Public campus access</div>
            </div>
            <Link
              to="/login"
              className="w-full flex items-center gap-2 justify-center rounded-xl bg-primary p-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
