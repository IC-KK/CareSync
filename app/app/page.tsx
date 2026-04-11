"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase, type Patient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "day1", label: "Day 1 Intake" },
  { id: "discharge", label: "Discharge Readiness" },
  { id: "post", label: "Post-Discharge" },
  { id: "exec", label: "Executive", locked: true },
] as const;

type TabId = (typeof TABS)[number]["id"];
type Role = "Nurse" | "Case Coordinator" | "COO";

const STATUS_STYLES: Record<Patient["status"], string> = {
  admitted: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  "discharge-ready": "bg-green-100 text-green-800 hover:bg-green-100",
  monitoring: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  discharged: "bg-gray-200 text-gray-700 hover:bg-gray-200",
};

const STATUS_LABELS: Record<Patient["status"], string> = {
  admitted: "Admitted",
  "discharge-ready": "Discharge-ready",
  monitoring: "Monitoring",
  discharged: "Discharged",
};

export default function Home() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("day1");
  const [role, setRole] = useState<Role>("Nurse");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("is_hero", { ascending: false })
        .order("room", { ascending: true })
        .limit(6);
      if (error) {
        console.error(error);
        return;
      }
      const list = (data ?? []) as Patient[];
      setPatients(list);
      const hero = list.find((p) => p.mrn === "MRN-10234") ?? list[0];
      if (hero) setSelectedId(hero.id);
    })();
  }, []);

  const selected = patients.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="h-14 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-slate-900 text-white grid place-items-center text-xs font-semibold">
              CS
            </div>
            <span className="text-lg font-semibold tracking-tight">
              CareSync
            </span>
          </div>

          <nav className="flex items-center gap-1">
            {TABS.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "h-9 px-4 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {t.label}
                  {"locked" in t && t.locked && (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="Nurse">Nurse</option>
              <option value="Case Coordinator">Case Coordinator</option>
              <option value="COO">COO</option>
            </select>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="px-5 py-4">
            <div className="text-xs uppercase tracking-wider text-slate-500">
              Unit
            </div>
            <div className="text-lg font-semibold mt-0.5">4 Cardiac</div>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {patients.map((p) => {
              const isSelected = p.id === selectedId;
              const pct = Math.min(
                100,
                Math.round((p.los_actual_days / p.los_predicted_days) * 100)
              );
              return (
                <Card
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "p-3 cursor-pointer transition-all border",
                    isSelected
                      ? "border-slate-900 ring-2 ring-slate-900/10 shadow-sm"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {p.full_name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.age} {p.sex} · Room {p.room}
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] shrink-0",
                        STATUS_STYLES[p.status]
                      )}
                    >
                      {STATUS_LABELS[p.status]}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 mt-2 line-clamp-1">
                    {p.dx_primary}
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>LOS</span>
                      <span>
                        {p.los_actual_days} / {p.los_predicted_days} days
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </Card>
              );
            })}
            {patients.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-8">
                Loading patients…
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-8 overflow-y-auto">
          {selected ? (
            <div>
              <div className="mb-6">
                <div className="text-xs uppercase tracking-wider text-slate-500">
                  {TABS.find((t) => t.id === activeTab)?.label}
                </div>
                <h1 className="text-2xl font-semibold mt-1">
                  {selected.full_name}
                </h1>
                <div className="text-sm text-slate-500 mt-1">
                  {selected.mrn} · {selected.age} {selected.sex} · Room{" "}
                  {selected.room} · {selected.dx_primary}
                </div>
              </div>
              <Card className="p-8 border-dashed border-slate-300 bg-white">
                <div className="text-sm text-slate-400">
                  [{TABS.find((t) => t.id === activeTab)?.label}] content for{" "}
                  {selected.full_name} — coming in a later phase. Role: {role}.
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Select a patient…</div>
          )}
        </main>
      </div>
    </div>
  );
}
