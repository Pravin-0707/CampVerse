import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { User, Bell, Footprints, Save, RotateCcw, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: Settings });

const DEFAULT_SETTINGS = {
  name: "Alex Sharma",
  email: "alex.sharma@skcet.ac.in",
  role: "student" as const,
  department: "Computer Science & Engineering",
  campus: "Sri Krishna College of Engineering and Technology (SKCET), Coimbatore",
  language: "English (India)",
  phone: "+91 98765 43210",
  studentId: "717822P101",
  appearance: {
    darkMode: true,
    reducedMotion: false,
    highQualityMap: true,
  },
  notifications: {
    announcements: true,
    classAlerts: true,
    emergencyAlerts: true,
    timetableChanges: true,
  },
  accessibility: {
    highContrast: false,
    voiceNavigation: true,
    autoRerouting: true,
  },
  navigation: {
    walkingSpeedMpm: 70,
    avoidStairs: false,
  },
};

function Settings() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || DEFAULT_SETTINGS.name,
    email: user?.email || DEFAULT_SETTINGS.email,
    role: user?.role || DEFAULT_SETTINGS.role,
    department: user?.department || DEFAULT_SETTINGS.department,
    campus: user?.campus || DEFAULT_SETTINGS.campus,
    language: user?.language || DEFAULT_SETTINGS.language,
    phone: user?.phone || DEFAULT_SETTINGS.phone,
    studentId: user?.studentId || DEFAULT_SETTINGS.studentId,
    appearance: {
      darkMode: user?.appearance?.darkMode ?? DEFAULT_SETTINGS.appearance.darkMode,
      reducedMotion: user?.appearance?.reducedMotion ?? DEFAULT_SETTINGS.appearance.reducedMotion,
      highQualityMap:
        user?.appearance?.highQualityMap ?? DEFAULT_SETTINGS.appearance.highQualityMap,
    },
    notifications: {
      announcements:
        user?.notifications?.announcements ?? DEFAULT_SETTINGS.notifications.announcements,
      classAlerts: user?.notifications?.classAlerts ?? DEFAULT_SETTINGS.notifications.classAlerts,
      emergencyAlerts:
        user?.notifications?.emergencyAlerts ?? DEFAULT_SETTINGS.notifications.emergencyAlerts,
      timetableChanges:
        user?.notifications?.timetableChanges ?? DEFAULT_SETTINGS.notifications.timetableChanges,
    },
    accessibility: {
      highContrast:
        user?.accessibility?.highContrast ?? DEFAULT_SETTINGS.accessibility.highContrast,
      voiceNavigation:
        user?.accessibility?.voiceNavigation ?? DEFAULT_SETTINGS.accessibility.voiceNavigation,
      autoRerouting:
        user?.accessibility?.autoRerouting ?? DEFAULT_SETTINGS.accessibility.autoRerouting,
    },
    navigation: {
      walkingSpeedMpm:
        user?.navigation?.walkingSpeedMpm ?? DEFAULT_SETTINGS.navigation.walkingSpeedMpm,
      avoidStairs: user?.navigation?.avoidStairs ?? DEFAULT_SETTINGS.navigation.avoidStairs,
    },
  });

  // Sync when user auth data loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: user.role || prev.role,
        department: user.department || prev.department,
        campus: user.campus || prev.campus,
        language: user.language || prev.language,
        phone: user.phone || prev.phone,
        studentId: user.studentId || prev.studentId,
        appearance: {
          darkMode: user.appearance?.darkMode ?? prev.appearance.darkMode,
          reducedMotion: user.appearance?.reducedMotion ?? prev.appearance.reducedMotion,
          highQualityMap: user.appearance?.highQualityMap ?? prev.appearance.highQualityMap,
        },
        notifications: {
          announcements: user.notifications?.announcements ?? prev.notifications.announcements,
          classAlerts: user.notifications?.classAlerts ?? prev.notifications.classAlerts,
          emergencyAlerts:
            user.notifications?.emergencyAlerts ?? prev.notifications.emergencyAlerts,
          timetableChanges:
            user.notifications?.timetableChanges ?? prev.notifications.timetableChanges,
        },
        accessibility: {
          highContrast: user.accessibility?.highContrast ?? prev.accessibility.highContrast,
          voiceNavigation:
            user.accessibility?.voiceNavigation ?? prev.accessibility.voiceNavigation,
          autoRerouting: user.accessibility?.autoRerouting ?? prev.accessibility.autoRerouting,
        },
        navigation: {
          walkingSpeedMpm: user.navigation?.walkingSpeedMpm ?? prev.navigation.walkingSpeedMpm,
          avoidStairs: user.navigation?.avoidStairs ?? prev.navigation.avoidStairs,
        },
      }));
    }
  }, [user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile(formData as any);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch {
      // Toast shown in updateProfile
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (
    section: "appearance" | "notifications" | "accessibility" | "navigation",
    key: string,
    val: boolean | number,
  ) => {
    const nextSection = {
      ...(formData[section] as any),
      [key]: val,
    };

    const nextFormData = {
      ...formData,
      [section]: nextSection,
    };

    setFormData(nextFormData);

    // Auto-save setting to backend and local storage
    try {
      await updateProfile({
        [section]: nextSection,
      } as any);
    } catch {}
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_SETTINGS);
    updateProfile(DEFAULT_SETTINGS as any);
    toast.info("Settings reset to defaults");
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Settings & Preferences
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Personalize your profile, notifications, appearance, and navigation parameters. All
              edits are updated in the background data.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-border/60 bg-white/[0.03] hover:bg-white/[0.08] px-3.5 py-2 text-xs font-semibold text-muted-foreground transition flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-xs font-semibold shadow-lg shadow-primary/20 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : savedSuccess ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving..." : savedSuccess ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Profile Card */}
            <GlassCard className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      User Profile & Identification
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Editable personal details and campus role
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">
                  Live Background Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Campus Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary capitalize"
                  >
                    <option value="student">Student</option>
                    <option value="professor">Professor / Faculty</option>
                    <option value="admin">Administrator</option>
                    <option value="guest">Campus Visitor / Guest</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Department / Discipline
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. Computer Science & Engineering"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Campus / Institution
                  </label>
                  <input
                    type="text"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. SKCET Coimbatore"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="your.email@skcet.ac.in"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Preferred Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="English (India)">English (India)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Malayalam">Malayalam (മലയാളം)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Student / Faculty ID
                  </label>
                  <input
                    type="text"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="e.g. 717822P101"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Notifications Settings */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Notifications & Alerts</h3>
                  <p className="text-[11px] text-muted-foreground">
                    Stay informed on campus updates and classes
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-border/30">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Campus Announcements
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Official notifications, events, and seminar notices
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.announcements}
                    onCheckedChange={(checked) =>
                      handleToggle("notifications", "announcements", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-border/30">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Class & Lab Alerts</div>
                    <div className="text-[11px] text-muted-foreground">
                      Upcoming lecture reminders and room assignments
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.classAlerts}
                    onCheckedChange={(checked) =>
                      handleToggle("notifications", "classAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-border/30">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Emergency & Security Alerts
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Critical broadcast messages and campus advisories
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.emergencyAlerts}
                    onCheckedChange={(checked) =>
                      handleToggle("notifications", "emergencyAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-border/30">
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Timetable & Schedule Updates
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Instant alerts when classes or exams are rescheduled
                    </div>
                  </div>
                  <Switch
                    checked={formData.notifications.timetableChanges}
                    onCheckedChange={(checked) =>
                      handleToggle("notifications", "timetableChanges", checked)
                    }
                  />
                </div>
              </div>
            </GlassCard>

            {/* Accessibility & Navigation Settings */}
            <GlassCard className="p-5 lg:col-span-2">
              <div className="flex items-center gap-2 mb-4 border-b border-border/40 pb-3">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Footprints className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Accessibility & Navigation Preferences
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Parameters governing A* pedestrian route calculation & live GPS guidance
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-border/30">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Voice Guided Navigation
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Spoken turn-by-turn prompts during live walkway navigation
                      </div>
                    </div>
                    <Switch
                      checked={formData.accessibility.voiceNavigation}
                      onCheckedChange={(checked) =>
                        handleToggle("accessibility", "voiceNavigation", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-border/30">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Auto-Reroute When Off Walkway
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Automatically recompute A* path when deviation is detected
                      </div>
                    </div>
                    <Switch
                      checked={formData.accessibility.autoRerouting}
                      onCheckedChange={(checked) =>
                        handleToggle("accessibility", "autoRerouting", checked)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-border/30">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        High Contrast Text & Markers
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Enhanced visual borders on all map elements
                      </div>
                    </div>
                    <Switch
                      checked={formData.accessibility.highContrast}
                      onCheckedChange={(checked) =>
                        handleToggle("accessibility", "highContrast", checked)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4 p-3 rounded-xl bg-white/[0.02] border border-border/30">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-foreground">Preferred Walking Speed</span>
                      <span className="font-mono text-primary font-bold">
                        {formData.navigation.walkingSpeedMpm} meters/min
                      </span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      step="5"
                      value={formData.navigation.walkingSpeedMpm}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleToggle("navigation", "walkingSpeedMpm", val);
                      }}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Leisurely (40 m/min)</span>
                      <span>Standard (70 m/min)</span>
                      <span>Brisk (120 m/min)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/30">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        Avoid Stairs & Steep Inclines
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Wheelchair & stroller friendly route prioritization
                      </div>
                    </div>
                    <Switch
                      checked={formData.navigation.avoidStairs}
                      onCheckedChange={(checked) =>
                        handleToggle("navigation", "avoidStairs", checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Bottom Save Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="rounded-xl border border-border/60 bg-white/[0.03] hover:bg-white/[0.08] px-4 py-2.5 text-xs font-semibold text-muted-foreground transition"
            >
              Reset to Defaults
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 text-xs font-semibold shadow-lg shadow-primary/25 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving Changes..." : "Save All Changes"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
