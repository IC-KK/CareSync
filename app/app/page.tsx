"use client";

import { useEffect, useState } from "react";
import { Lock, Pill, Car, Calendar, BookOpen, CheckCircle, Zap } from "lucide-react";
import { supabase, type Patient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AutoAction = {
  id: string;
  patient_id: string;
  icon: string;
  label: string;
  detail: string;
  created_at: string;
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pill: Pill,
  car: Car,
  calendar: Calendar,
  "book-open": BookOpen,
};

const ACTION_ICON_COLORS: Record<string, string> = {
  pill: "text-rose-500",
  car: "text-sky-500",
  calendar: "text-emerald-500",
  "book-open": "text-violet-500",
};

const DAISY_MRN = "MRN-10234";

const DAISY_TIMELINE = [
  {
    time: "07:15",
    title: "Admitted to 4C-12",
    detail: "Cardiology admit, Dr. Patel attending",
  },
  {
    time: "08:30",
    title: "Initial assessment complete",
    detail: "Vitals, meds reconciled, NT-proBNP drawn",
  },
  {
    time: "09:45",
    title: "SDOH screening complete",
    detail: "6 domains assessed, 2 high-risk flagged",
  },
  {
    time: "10:20",
    title: "Auto-actions triggered",
    detail: "Pharmacy assistance, transport, follow-up, teach-back",
  },
  {
    time: "11:00",
    title: "Care team huddle",
    detail: "Discharge target: Day 6, risk tier: high",
  },
];

type SdohRow = {
  id: string;
  patient_id: string;
  domain: string;
  detail: string;
  risk: "high" | "moderate" | "low";
  created_at: string;
};

const RISK_STYLES: Record<SdohRow["risk"], string> = {
  high: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  moderate: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
  low: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
};

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
  const [sdoh, setSdoh] = useState<SdohRow[]>([]);
  const [sdohLoading, setSdohLoading] = useState(false);
  const [actions, setActions] = useState<AutoAction[]>([]);

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

  useEffect(() => {
    if (!selectedId) {
      setSdoh([]);
      setActions([]);
      return;
    }
    setSdohLoading(true);
    (async () => {
      const [sdohRes, actionsRes] = await Promise.all([
        supabase
          .from("sdoh_screening")
          .select("*")
          .eq("patient_id", selectedId)
          .order("created_at", { ascending: true }),
        supabase
          .from("auto_actions")
          .select("*")
          .eq("patient_id", selectedId)
          .order("created_at", { ascending: true }),
      ]);
      if (sdohRes.error) console.error(sdohRes.error);
      if (actionsRes.error) console.error(actionsRes.error);
      setSdoh((sdohRes.data ?? []) as SdohRow[]);
      setActions((actionsRes.data ?? []) as AutoAction[]);
      setSdohLoading(false);
    })();
  }, [selectedId]);

  const selected = patients.find((p) => p.id === selectedId) ?? null;
  const riskCounts = {
    high: sdoh.filter((r) => r.risk === "high").length,
    moderate: sdoh.filter((r) => r.risk === "moderate").length,
    low: sdoh.filter((r) => r.risk === "low").length,
  };

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
              {activeTab === "day1" ? (
                <Day1Intake
                  sdoh={sdoh}
                  actions={actions}
                  loading={sdohLoading}
                  riskCounts={riskCounts}
                  patientMrn={selected.mrn}
                />
              ) : (
                <Card className="p-8 border-dashed border-slate-300 bg-white">
                  <div className="text-sm text-slate-400">
                    [{TABS.find((t) => t.id === activeTab)?.label}] content for{" "}
                    {selected.full_name} — coming in a later phase. Role:{" "}
                    {role}.
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">Select a patient…</div>
          )}
        </main>
      </div>
    </div>
  );
}

function Day1Intake({
  sdoh,
  actions,
  loading,
  riskCounts,
  patientMrn,
}: {
  sdoh: SdohRow[];
  actions: AutoAction[];
  loading: boolean;
  riskCounts: { high: number; moderate: number; low: number };
  patientMrn: string;
}) {
  const showTimeline = patientMrn === DAISY_MRN;
  if (loading) {
    return (
      <div className="text-sm text-slate-400">Loading Day 1 intake…</div>
    );
  }

  if (sdoh.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-slate-400 text-center max-w-sm">
          No Day 1 intake screening on file for this patient.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Social Determinants of Health — Day 1 Screening
          </h2>
        </div>

        <div className="flex items-center gap-2 mb-5">
          <RiskPill count={riskCounts.high} label="high" risk="high" />
          <span className="text-slate-300">·</span>
          <RiskPill
            count={riskCounts.moderate}
            label="moderate"
            risk="moderate"
          />
          <span className="text-slate-300">·</span>
          <RiskPill count={riskCounts.low} label="low" risk="low" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sdoh.map((row) => (
            <Card
              key={row.id}
              className="p-4 border border-slate-200 bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-sm text-slate-900">
                  {row.domain}
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] uppercase tracking-wide shrink-0 border",
                    RISK_STYLES[row.risk]
                  )}
                >
                  {row.risk}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                {row.detail}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {actions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            In Progress
          </h3>
          <Card className="border border-slate-200 bg-white overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {actions.map((a) => {
                const Icon = ACTION_ICONS[a.icon] ?? CheckCircle;
                return (
                  <li
                    key={a.id}
                    className="flex items-start gap-4 px-4 py-3.5"
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold uppercase tracking-wide shrink-0 mt-0.5">
                      <Zap className="h-3 w-3" />
                      Auto
                    </span>
                    <span className="h-8 w-8 rounded-md bg-slate-50 border border-slate-200 grid place-items-center shrink-0">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          ACTION_ICON_COLORS[a.icon] ?? "text-slate-500"
                        )}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-900">
                        {a.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {a.detail}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </section>
      )}

      {showTimeline && (
        <section>
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Day 1 Timeline
          </h3>
          <ol className="relative border-l border-slate-200 ml-20 space-y-6">
            {DAISY_TIMELINE.map((item, i) => (
              <li key={i} className="relative pl-6">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-white border-2 border-slate-400" />
                <span className="absolute -left-24 top-0 w-16 text-right text-xs font-medium text-slate-500 tabular-nums">
                  {item.time}
                </span>
                <div className="text-sm font-semibold text-slate-900">
                  {item.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {item.detail}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function RiskPill({
  count,
  label,
  risk,
}: {
  count: number;
  label: string;
  risk: SdohRow["risk"];
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        RISK_STYLES[risk]
      )}
    >
      <span className="tabular-nums font-semibold">{count}</span>
      <span>{label}</span>
    </span>
  );
}
