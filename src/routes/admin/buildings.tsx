import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { GlassCard } from "@/components/GlassCard";
import { api } from "@/lib/api";
import { Building, Plus, Trash2, Edit2, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/buildings")({ component: AdminBuildingsPage });

function AdminBuildingsPage() {
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [departmentsStr, setDepartmentsStr] = useState("");
  const [floors, setFloors] = useState(4);
  const [occupancy, setOccupancy] = useState(50);
  const [status, setStatus] = useState("Open");

  const loadBuildings = () => {
    setLoading(true);
    api
      .getBuildings()
      .then(setBuildings)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setCode("");
    setName("");
    setDepartmentsStr("");
    setFloors(4);
    setOccupancy(50);
    setStatus("Open");
    setShowModal(true);
  };

  const handleOpenEdit = (b: any) => {
    setEditingId(b._id);
    setCode(b.code || "");
    setName(b.name || "");
    setDepartmentsStr((b.departments || []).join(", "));
    setFloors(b.floors || 4);
    setOccupancy(b.occupancy || 0);
    setStatus(b.status || "Open");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      name,
      departments: departmentsStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      floors: Number(floors),
      occupancy: Number(occupancy),
      status,
    };

    try {
      if (editingId) {
        await api.updateBuilding(editingId, payload);
        toast.success("Building updated!");
      } else {
        await api.createBuilding(payload);
        toast.success("Building created!");
      }
      setShowModal(false);
      loadBuildings();
    } catch (err: any) {
      toast.error(err.message || "Failed to save building");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this building?")) return;
    try {
      await api.deleteBuilding(id);
      toast.success("Building deleted");
      loadBuildings();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete building");
    }
  };

  return (
    <AppLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Admin · Building Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage physical campus building telemetry & records.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground flex items-center gap-2 hover:opacity-95 shadow-lg shadow-primary/20 transition"
        >
          <Plus className="h-4 w-4" /> Add Building
        </button>
      </div>

      <GlassCard className="p-6 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="pb-3 px-3">Code</th>
              <th className="pb-3 px-3">Building Name</th>
              <th className="pb-3 px-3">Departments</th>
              <th className="pb-3 px-3">Floors</th>
              <th className="pb-3 px-3">Occupancy</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {buildings.map((b) => (
              <tr key={b._id} className="hover:bg-muted/20 transition">
                <td className="py-3 px-3 font-mono font-semibold text-primary">
                  {b.code || "b-0"}
                </td>
                <td className="py-3 px-3 font-medium">{b.name}</td>
                <td className="py-3 px-3 text-xs text-muted-foreground">
                  {(b.departments || []).join(", ")}
                </td>
                <td className="py-3 px-3">{b.floors}</td>
                <td className="py-3 px-3 font-semibold">{b.occupancy}%</td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${b.status === "Open" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : b.status === "Maintenance" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? "Edit Building" : "Add New Building"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Building Code</label>
                <input
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="b1"
                  className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Building Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="C1 Block"
                  className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Departments (comma separated)
                </label>
                <input
                  value={departmentsStr}
                  onChange={(e) => setDepartmentsStr(e.target.value)}
                  placeholder="Computer Science, AI Lab"
                  className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Floors</label>
                  <input
                    type="number"
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Occupancy %</label>
                  <input
                    type="number"
                    value={occupancy}
                    onChange={(e) => setOccupancy(Number(e.target.value))}
                    className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl bg-background/60 border border-border px-3 py-2 text-sm"
                >
                  <option value="Open">Open</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Save Building
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </AppLayout>
  );
}
