import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { GlassCard } from "@/components/GlassCard";
import { Zap, Mail, Lock, LogIn, ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login({ email, password });
      navigate({ to: "/" });
    } catch {
      setBusy(false);
    }
  };

  const fillDemoCreds = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 mb-3">
            <Zap className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Smart Cadence Grid</h1>
          <p className="text-sm text-muted-foreground mt-1">Campus Intelligence Digital Twin</p>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" /> Sign In to Campus Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@campus.edu"
                  className="w-full rounded-xl bg-background/60 border border-border/60 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-background/60 border border-border/60 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground flex items-center justify-center gap-2 hover:opacity-95 transition shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {busy ? "Signing in..." : "Sign In"} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              className="w-full rounded-xl border border-border/60 bg-muted/30 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition"
            >
              Continue as Guest
            </button>
          </form>

          {/* Quick System Credentials Assistant */}
          <div className="mt-6 pt-6 border-t border-border/40">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> System Access Credentials
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCreds("admin@campus.edu", "admin123")}
                className="p-2 rounded-xl bg-primary/10 border border-primary/30 text-left hover:bg-primary/20 transition"
              >
                <div className="text-xs font-semibold text-primary">Admin Account</div>
                <div className="text-[10px] text-muted-foreground">Full Access</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCreds("student@campus.edu", "student123")}
                className="p-2 rounded-xl bg-muted/40 border border-border/40 text-left hover:bg-muted/60 transition"
              >
                <div className="text-xs font-semibold text-foreground">Student Account</div>
                <div className="text-[10px] text-muted-foreground">Standard View</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoCreds("professor@campus.edu", "professor123")}
                className="p-2 rounded-xl bg-muted/40 border border-border/40 text-left hover:bg-muted/60 transition"
              >
                <div className="text-xs font-semibold text-foreground">Professor Account</div>
                <div className="text-[10px] text-muted-foreground">Faculty Access</div>
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
