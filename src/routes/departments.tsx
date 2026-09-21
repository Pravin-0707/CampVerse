import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/departments")({ component: Departments });

const departments = [
  "Computer Science and Engineering (AI & ML)",
  "Information Technology",
  "Civil Engineering",
  "Computer Science and Engineering",
  "Computer Science and Engineering (Cyber Security)",
  "Electrical and Electronics Engineering",
  "Electronics and Communication Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Artificial Intelligence and Data Science",
  "Computer Science and Business Systems",
  "Data Science (M.Tech)",
  "Structural Engineering (M.E)",
  "Computer Science and Engineering (M.E)",
  "Business Administration (MBA)",
  "Science and Humanities",
];

function Departments() {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Academic programmes and departments at Sri Krishna College of Engineering and Technology.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((name, i) => (
          <GlassCard key={name} hoverable transition={{ delay: i * 0.04 }}>
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span className="text-[11px] text-muted-foreground">SKCET</span>
            </div>
            <h3 className="mt-4 text-base font-semibold">{name}</h3>
            <p className="mt-2 text-xs text-muted-foreground">
              Official programme listed by SKCET.
            </p>
          </GlassCard>
        ))}
      </div>
    </AppLayout>
  );
}
