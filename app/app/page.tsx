"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Lock,
  Unlock,
  Pill,
  Car,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Zap,
  Clock,
  AlertCircle,
  PhoneCall,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { supabase, type Patient } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

type Barrier = {
  id: string;
  patient_id: string;
  type: string;
  detail: string;
  severity: "high" | "moderate" | "low";
  next_step: string;
  source: string;
  sla_hours: number;
  hours_open: number;
  status: "open" | "in_progress" | "resolved";
  created_at: string;
};

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
type Role = "RN" | "Case Manager" | "Transitions RN" | "COO";

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
  const [role, setRole] = useState<Role>("RN");
  const [sdoh, setSdoh] = useState<SdohRow[]>([]);
  const [sdohLoading, setSdohLoading] = useState(false);
  const [actions, setActions] = useState<AutoAction[]>([]);
  const [barriers, setBarriers] = useState<Barrier[]>([]);

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
      setBarriers([]);
      return;
    }
    setSdohLoading(true);
    (async () => {
      const [sdohRes, actionsRes, barriersRes] = await Promise.all([
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
        supabase
          .from("barriers")
          .select("*")
          .eq("patient_id", selectedId),
      ]);
      if (sdohRes.error) console.error(sdohRes.error);
      if (actionsRes.error) console.error(actionsRes.error);
      if (barriersRes.error) console.error(barriersRes.error);
      setSdoh((sdohRes.data ?? []) as SdohRow[]);
      setActions((actionsRes.data ?? []) as AutoAction[]);
      setBarriers((barriersRes.data ?? []) as Barrier[]);
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
                    role === "COO"
                      ? <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                      : <Lock className="h-3.5 w-3.5" />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Role</span>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as Role)}
            >
              <SelectTrigger className="h-9 w-48 text-sm font-medium text-slate-700 bg-white border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RN">RN</SelectItem>
                <SelectItem value="Case Manager">Case Manager</SelectItem>
                <SelectItem value="Transitions RN">Transitions RN</SelectItem>
                <SelectItem value="COO">COO</SelectItem>
              </SelectContent>
            </Select>
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
              {activeTab !== "post" && activeTab !== "exec" && (
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
              )}
              {activeTab === "day1" && (
                <Day1Intake
                  sdoh={sdoh}
                  actions={actions}
                  loading={sdohLoading}
                  riskCounts={riskCounts}
                  patientMrn={selected.mrn}
                />
              )}
              {activeTab === "discharge" && (
                <div className="space-y-10">
                  <ReadinessSummary barriers={barriers} role={role} />
                  <Separator />
                  <DischargeReadiness barriers={barriers} />
                  <Separator />
                  <DigitalTwin patient={selected} />
                </div>
              )}
              {activeTab === "post" && (
                <PostDischargeTab role={role} />
              )}
              {activeTab === "exec" && (
                <ExecutiveDashboard role={role} />
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

const CHECKLIST_ITEMS = [
  { label: "Meds Reconciled", status: "done" as const },
  { label: "Transport Confirmed", status: "blocked" as const },
  { label: "Follow-up Booked", status: "done" as const },
  { label: "Patient Education", status: "in-progress" as const },
];

function ReadinessSummary({
  barriers,
  role,
}: {
  barriers: Barrier[];
  role: Role;
}) {
  const [authorized, setAuthorized] = useState(false);

  const total = barriers.length;
  const resolved = barriers.filter((b) => b.status === "resolved").length;
  const score = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const allChecklistDone = CHECKLIST_ITEMS.every((c) => c.status === "done");
  const canDischarge = score === 100 && allChecklistDone;

  let scoreColor = "text-rose-600";
  let scoreLabel = "Not Ready";
  if (score === 100) {
    scoreColor = "text-emerald-600";
    scoreLabel = "Ready for Discharge";
  } else if (score >= 80) {
    scoreColor = "text-sky-600";
    scoreLabel = "Nearly Ready";
  } else if (score >= 50) {
    scoreColor = "text-amber-600";
    scoreLabel = "In Progress";
  }

  return (
    <section>
      <div className="flex flex-col items-center text-center gap-1 mb-6">
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Discharge Readiness
        </div>
        <div className={cn("text-5xl font-bold tabular-nums", scoreColor)}>
          {score}%
        </div>
        <div className={cn("text-sm font-medium", scoreColor)}>
          {scoreLabel}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white"
          >
            {item.status === "done" && (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            )}
            {item.status === "blocked" && (
              <XCircle className="h-4 w-4 text-rose-500" />
            )}
            {item.status === "in-progress" && (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
            <span className="text-sm font-medium text-slate-700">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {role === "Case Manager" && (
        <div className="mb-2">
          {authorized ? (
            <div className="w-full py-4 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-800 text-lg font-semibold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Discharge Authorized ✓
              <span className="text-sm font-normal text-emerald-600 ml-2">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          ) : (
            <button
              type="button"
              disabled={!canDischarge}
              onClick={() => setAuthorized(true)}
              className={cn(
                "w-full py-4 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 transition-colors",
                canDischarge
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed"
              )}
            >
              {canDischarge ? (
                <>
                  <Unlock className="h-5 w-5" />
                  Authorize Discharge
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  Discharge Blocked — Resolve Open Barriers
                </>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function DischargeReadiness({ barriers }: { barriers: Barrier[] }) {
  if (barriers.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Discharge Readiness
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Blockers preventing safe discharge
        </p>
        <div className="flex items-center justify-center py-24">
          <div className="text-sm text-slate-400">
            No barriers flagged for this patient.
          </div>
        </div>
      </div>
    );
  }

  const pctOpen = (b: Barrier) =>
    b.sla_hours > 0 ? b.hours_open / b.sla_hours : 0;

  const sorted = [...barriers].sort((a, b) => {
    const aResolved = a.status === "resolved" ? 1 : 0;
    const bResolved = b.status === "resolved" ? 1 : 0;
    if (aResolved !== bResolved) return aResolved - bResolved;
    return pctOpen(b) - pctOpen(a);
  });

  const counts = {
    open: barriers.filter((b) => b.status === "open").length,
    in_progress: barriers.filter((b) => b.status === "in_progress").length,
    resolved: barriers.filter((b) => b.status === "resolved").length,
    at_risk: barriers.filter(
      (b) => b.status !== "resolved" && pctOpen(b) > 0.8
    ).length,
  };

  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Discharge Readiness
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Blockers preventing safe discharge
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <StatusPill
          count={counts.open}
          label="open"
          className="bg-slate-100 text-slate-700 border-slate-200"
        />
        <span className="text-slate-300">·</span>
        <StatusPill
          count={counts.in_progress}
          label="in progress"
          className="bg-blue-100 text-blue-800 border-blue-200"
        />
        <span className="text-slate-300">·</span>
        <StatusPill
          count={counts.resolved}
          label="resolved"
          className="bg-green-100 text-green-800 border-green-200"
        />
        <span className="text-slate-300">·</span>
        <StatusPill
          count={counts.at_risk}
          label="at risk"
          className="bg-red-100 text-red-800 border-red-200"
          icon={<AlertCircle className="h-3 w-3" />}
        />
      </div>

      <div className="space-y-3">
        {sorted.map((b) => (
          <BarrierCard key={b.id} barrier={b} />
        ))}
      </div>
    </section>
  );
}

function BarrierCard({ barrier }: { barrier: Barrier }) {
  const pct = barrier.sla_hours
    ? Math.min(100, Math.round((barrier.hours_open / barrier.sla_hours) * 100))
    : 0;
  const ratio = barrier.sla_hours ? barrier.hours_open / barrier.sla_hours : 0;
  const remaining = Math.max(0, barrier.sla_hours - barrier.hours_open);
  const pastSla = barrier.hours_open > barrier.sla_hours;

  const isResolved = barrier.status === "resolved";

  let barColor = "bg-green-500";
  if (isResolved) {
    barColor = "bg-green-500";
  } else if (ratio > 0.8 || pastSla) {
    barColor = "bg-red-500";
  } else if (ratio >= 0.5) {
    barColor = "bg-amber-500";
  }

  return (
    <Card className="p-4 border border-slate-200 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wide border border-slate-200">
              {barrier.source}
            </span>
            <StatusChip status={barrier.status} />
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="font-semibold text-sm text-slate-900">
              {barrier.type}
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {barrier.detail}
          </p>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-slate-400">Next:</span>
            <span>{barrier.next_step}</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2 min-w-[160px]">
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] uppercase tracking-wide border",
              RISK_STYLES[barrier.severity]
            )}
          >
            {barrier.severity}
          </Badge>
          {!isResolved && (
            <div className="w-full">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  SLA
                </span>
                <span className="tabular-nums">
                  {barrier.hours_open}h / {barrier.sla_hours}h
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barColor)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div
                className={cn(
                  "text-[10px] mt-1 tabular-nums text-right",
                  pastSla ? "text-red-600 font-semibold" : "text-slate-500"
                )}
              >
                {pastSla
                  ? `${(barrier.hours_open - barrier.sla_hours).toFixed(1)}h past SLA`
                  : `${remaining.toFixed(1)}h remaining`}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function StatusChip({ status }: { status: Barrier["status"] }) {
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[10px] font-semibold uppercase tracking-wide border border-green-200">
        <CheckCircle className="h-3 w-3" />
        Resolved
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold uppercase tracking-wide border border-blue-200">
        In progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold uppercase tracking-wide border border-slate-200">
      Open
    </span>
  );
}

function StatusPill({
  count,
  label,
  className,
  icon,
}: {
  count: number;
  label: string;
  className: string;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        className
      )}
    >
      {icon}
      <span className="tabular-nums font-semibold">{count}</span>
      <span>{label}</span>
    </span>
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

function DigitalTwin({ patient }: { patient: Patient }) {
  const [dischargeDay, setDischargeDay] = useState<number>(
    Math.round(patient.los_predicted_days)
  );

  useEffect(() => {
    setDischargeDay(Math.round(patient.los_predicted_days));
  }, [patient.id, patient.los_predicted_days]);

  const aiOptimal = patient.los_predicted_days;
  const diff = dischargeDay - aiOptimal;

  const baseRisk = patient.readmission_risk_pct ?? (patient.readmission_risk_tier === "high" ? 28 : patient.readmission_risk_tier === "moderate" ? 18 : 10);
  let risk = baseRisk + (diff < 0 ? Math.abs(diff) * 8 : diff > 0 ? -diff * 2.5 : 0);
  risk = Math.max(5, Math.min(55, risk));

  const costPerDay = 2750;

  const riskColor = risk > 25 ? "text-rose-600" : risk > 15 ? "text-amber-600" : "text-emerald-600";
  const optimal = Math.abs(diff) < 0.5;

  const minDay = Math.max(1, patient.los_actual_days - 1);
  const maxDay = Math.ceil(aiOptimal + 3);

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Discharge Scenario Planning
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Adjust discharge day to model projected outcomes based on patient factors, barrier status, and SDOH profile
        </p>
      </div>

      <Card className="p-5 border-2 border-indigo-200 bg-indigo-50/30">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-900">
              Discharge Day
            </label>
            <span className="text-2xl font-bold text-indigo-700 tabular-nums">
              Day {dischargeDay}
            </span>
          </div>
          <input
            type="range"
            min={minDay}
            max={maxDay}
            step={1}
            value={dischargeDay}
            onChange={(e) => setDischargeDay(Number(e.target.value))}
            className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 tabular-nums">
            <span>Day {minDay}</span>
            <span className="text-indigo-600 font-semibold">AI optimal: Day {aiOptimal.toFixed(1)}</span>
            <span>Day {maxDay}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Readmission Risk
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", riskColor)}>
              {risk.toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {optimal ? "At AI-optimal day" : diff < 0 ? "\u2191 Early discharge risk" : "\u2193 Extended stay benefit"}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              &quot;Clinical Stability Window&quot;
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", diff <= 0 ? "text-green-600" : "text-amber-600")}>
              {diff <= 0 ? "Within Window" : "Extended"}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              at $2,750/day (Medicare FFS)
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              &quot;Days vs AI Target&quot;
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", diff <= 0 ? "text-green-600" : "text-amber-600")}>
              {diff === 0 ? "On Target" : diff < 0 ? `${Math.abs(diff).toFixed(1)}d early` : `${diff.toFixed(1)}d over`}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {optimal ? "Optimal window" : "vs AI-adjusted LOS"}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setDischargeDay(Math.round(aiOptimal))}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 bg-white rounded-md px-3 h-8 transition-colors"
          >
            Reset to AI optimal
          </button>
        </div>
      </Card>
    </section>
  );
}


function ExecutiveDashboard({ role }: { role: Role }) {
  if (role !== "COO") {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Lock className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-lg font-semibold text-slate-700">Executive Access Required</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-sm">
          This dashboard contains financial projections, ROI metrics, and penalty exposure data. Switch to COO role to unlock.
        </p>
      </div>
    );
  }

  const metrics = [
    { label: "Excess LOS Reduction", value: "-1.8d", sub: "vs pre-pilot baseline", delta: "42% reduction" },
    { label: "30-Day Readmission", value: "14.2%", sub: "down from 18.7%", delta: "4.5pt reduction" },
    { label: "HRRP Penalty Exposure", value: "$0", sub: "vs $412K projected", delta: "Full avoidance" },
    { label: "Barriers Resolved <4h", value: "68%", sub: "up from 31%", delta: "2.2x faster" },
    { label: "Discharge Before Noon", value: "41%", sub: "up from 22%", delta: "86% improvement" },
    { label: "Post-DC Engagement", value: "91%", sub: "SMS + Voice combined", delta: "New capability" },
  ];

  const financials = [
    { label: "Throughput gain (47 bed-days x $2,750 avg)", value: "$1,034,000" },
    { label: "HRRP penalty avoidance (Medicare readmission)", value: "$412,000" },
    { label: "Readmission cost savings (4.5pt reduction)", value: "$74,000" },
    { label: "Post-discharge early intervention (prevented ED)", value: "$38,000" },
  ];

  const ops = [
    { metric: "Avg LOS (HF, DRG 291)", pre: "6.3 days", now: "4.5 days", change: "\u25bc 1.8d" },
    { metric: "Avg excess days", pre: "2.1 days", now: "0.3 days", change: "\u25bc 85%" },
    { metric: "Discharge before noon", pre: "22%", now: "41%", change: "▲ 86%" },
    { metric: "Barrier detection", pre: "Manual / missed", now: "Auto, < 1 min", change: "▲ New" },
    { metric: "Barrier resolution", pre: "6.8h avg", now: "3.1h avg", change: "\u25bc 54%" },
    { metric: "30-day readmission", pre: "18.7%", now: "14.2%", change: "\u25bc 4.5 pts" },
    { metric: "Post-DC engagement", pre: "0%", now: "91%", change: "▲ New" },
  ];

  const barriersData = [
    { type: "Pharmacy / Medication", detected: 34, resolved: "29 (85%)", time: "2.8h" },
    { type: "Transportation", detected: 18, resolved: "16 (89%)", time: "4.1h" },
    { type: "Follow-up Scheduling", detected: 28, resolved: "26 (93%)", time: "1.4h" },
    { type: "Insurance / Prior Auth", detected: 12, resolved: "9 (75%)", time: "8.2h" },
    { type: "Social / SDOH", detected: 15, resolved: "12 (80%)", time: "5.6h" },
    { type: "Education / Language", detected: 30, resolved: "29 (97%)", time: "1.8h" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500">Executive Dashboard</div>
        <h1 className="text-2xl font-semibold mt-1">CareSync ROI — Cardiac Unit Pilot</h1>
        <p className="text-sm text-slate-500 mt-1">90-day pilot, 32-bed unit, ~5 discharges/day</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">24-Month Projected ROI</div>
          <div className="text-4xl font-bold mt-1 text-emerald-400">340%</div>
          <div className="text-xs text-slate-300 mt-2">Year 1 net savings: $1.18M</div>
          <div className="text-xs text-slate-400">Implementation: $380K/year</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-indigo-900 to-indigo-700 p-6 text-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-300">The Bed-Flip Effect</div>
          <div className="text-4xl font-bold mt-1 text-indigo-200">47 beds/yr</div>
          <div className="text-xs text-indigo-300 mt-2">2.1h faster per discharge</div>
          <div className="text-xs text-indigo-400">No construction. No new hires.</div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-rose-900 to-rose-700 p-6 text-white">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-300">HRRP Penalty Exposure</div>
          <div className="text-4xl font-bold mt-1 text-rose-200">$0</div>
          <div className="text-xs text-rose-300 mt-2">Avoided $412K in projected penalties</div>
          <div className="text-xs text-rose-400">FY2027: MA patients added to all 6 measures</div>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-3">
        {metrics.map((m) => (
          <Card key={m.label} className="p-3 border border-slate-200 bg-white">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">{m.label}</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{m.value}</div>
            <div className="text-[10px] text-slate-500">{m.sub}</div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-1">▲ {m.delta}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 border border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Financial Impact (Annualized from 90-Day Pilot)</h3>
          <div className="space-y-3">
            {financials.map((f) => (
              <div key={f.label} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{f.label}</span>
                <span className="font-semibold text-emerald-600">{f.value}</span>
              </div>
            ))}
            <div className="border-t-2 border-slate-900 pt-3 mt-3 flex justify-between items-center">
              <span className="font-bold text-slate-900">Gross Annual Value</span>
              <span className="font-bold text-emerald-600 text-lg">$1,558,000</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Implementation cost (Year 1)</span>
              <span className="font-semibold text-rose-600">-$380,000</span>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
              <span className="font-bold text-emerald-800">Net Year 1 Savings</span>
              <span className="font-bold text-emerald-800 text-lg">$1,178,000</span>
            </div>
          </div>
          <div className="mt-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs font-semibold text-indigo-700 mb-3">Scenario Planning</div>
            {[["If barriers resolved 1h faster on avg", "+$218K/yr", true], ["If readmission drops another 2 pts", "+$91K/yr", true], ["If expanded to Medicine unit (48 beds)", "+$1.4M/yr", true], ["If pilot fails to reduce LOS", "-$380K (cost only)", false]].map((s, i) => (
              <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-slate-600">{s[0] as string}</span>
                <span className={s[2] ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{s[1] as string}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 bg-white">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Where the Savings Come From</h3>
          {[{ label: "Throughput (bed-flip)", pct: 66, value: "$1.03M", color: "bg-indigo-500" }, { label: "HRRP penalty avoidance", pct: 26, value: "$412K", color: "bg-violet-500" }, { label: "Readmission savings", pct: 5, value: "$74K", color: "bg-emerald-500" }, { label: "Post-DC intervention", pct: 3, value: "$38K", color: "bg-sky-500" }].map((s) => (
            <div key={s.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600">{s.label}</span>
                <span className="font-semibold text-slate-700">{s.value}</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", s.color)} style={{ width: s.pct + "%" }} />
              </div>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-900 mt-6 mb-3">Payback Timeline</h3>
          {[{ period: "M1-2", label: "Setup", pct: 16, color: "bg-slate-400" }, { period: "M3", label: "Go-live", pct: 8, color: "bg-amber-500" }, { period: "M4-6", label: "Ramp", pct: 28, color: "bg-indigo-500" }, { period: "M7", label: "Breakeven", pct: 10, color: "bg-emerald-500" }, { period: "M8-12", label: "Net positive", pct: 45, color: "bg-emerald-600" }].map((t) => (
            <div key={t.period} className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-slate-500 w-8 text-right tabular-nums">{t.period}</span>
              <div className={cn("h-6 rounded flex items-center px-2 text-white text-[10px] font-semibold", t.color)} style={{ width: t.pct + "%" }}>
                {t.label}
              </div>
            </div>
          ))}

          <h3 className="text-sm font-semibold text-slate-900 mt-6 mb-3">Hospital-Wide Rollout (4 Units)</h3>
          <div className="grid grid-cols-2 gap-2">
            {[{ label: "Beds recovered/yr", value: "188" }, { label: "Throughput value", value: "$4.1M" }, { label: "Readmission savings", value: "$296K" }, { label: "Total annual value", value: "$4.8M" }].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-lg p-3 text-center border border-slate-200">
                <div className="text-[9px] font-semibold uppercase text-slate-500">{s.label}</div>
                <div className="text-lg font-bold text-indigo-700 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-5 border border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Operational Comparison — Pilot Unit</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Metric</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pre-Pilot</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Current</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Change</th>
            </tr>
          </thead>
          <tbody>
            {ops.map((o) => (
              <tr key={o.metric} className="border-b border-slate-100">
                <td className="py-2.5 text-slate-700">{o.metric}</td>
                <td className="py-2.5 text-slate-400">{o.pre}</td>
                <td className="py-2.5 font-semibold text-slate-900">{o.now}</td>
                <td className="py-2.5 font-semibold text-emerald-600">{o.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-5 border border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Barrier Resolution by Type</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Barrier</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Detected</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Resolved</th>
              <th className="text-left py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {barriersData.map((b) => (
              <tr key={b.type} className="border-b border-slate-100">
                <td className="py-2.5 text-slate-700">{b.type}</td>
                <td className="py-2.5 text-slate-500">{b.detected}</td>
                <td className="py-2.5 font-semibold text-slate-900">{b.resolved}</td>
                <td className="py-2.5 text-slate-500">{b.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-[11px] text-slate-500 leading-relaxed">
        <span className="font-semibold text-slate-700">Methodology: </span>
        Throughput calculated from avg discharge time reduction x daily census x blended per-diem ($2,750 Medicare FFS). HRRP penalty based on FY2026 CMS formula applied to current vs projected readmission rate. Readmission savings: observed rate reduction x avg readmission cost ($15,200, CMS 2024). All figures annualized from 90-day pilot on Cardiac 3E (32 beds, ~5 discharges/day).
      </div>
    </div>
  );
}


type CallState = "idle" | "calling" | "in-progress" | "completed" | "error";

function PostDischargeTab({ role }: { role: Role }) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const startCall = async () => {
    setCallState("calling");
    setErrorMsg(null);
    setElapsed(0);

    try {
      const res = await fetch("/api/trigger-call", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error" }));
        setErrorMsg(body.error ?? "Call failed");
        setCallState("error");
        return;
      }

      setCallState("in-progress");
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const secs = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(secs);
        if (secs >= 130) {
          endCall();
        }
      }, 1000);
    } catch {
      setErrorMsg("Network error — could not reach server");
      setCallState("error");
    }
  };

  const endCall = useCallback(() => {
    clearTimer();
    setCallState("completed");
  }, [clearTimer]);

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (role !== "Transitions RN") {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-slate-400 text-center max-w-sm">
          Switch to Transitions RN role to view post-discharge patients.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evelyn Carter patient card */}
      <Card className="p-5 border border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              Evelyn Carter
            </div>
            <div className="text-sm text-slate-500 mt-1">
              72 F · Heart Failure (HFrEF) · Discharged yesterday
            </div>
            <div className="text-sm text-slate-500 mt-1">
              Follow-up: Cardiology appt in 5 days · Caregiver: Daughter (lives
              nearby)
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant="secondary"
              className="bg-sky-100 text-sky-800 border border-sky-200 text-[10px] hover:bg-sky-100"
            >
              Post-Discharge Day 1
            </Badge>
            <Badge
              variant="secondary"
              className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] hover:bg-rose-100"
            >
              Readmission Risk: High
            </Badge>
          </div>
        </div>
      </Card>

      {/* Call section */}
      <Card className="p-5 border border-slate-200 bg-white">
        <h3 className="text-sm font-semibold text-slate-900">
          Post-Discharge Follow-Up Call
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-5">
          AI-assisted symptom screening and medication adherence check
        </p>
        <Separator className="mb-5" />

        <div className="flex flex-col items-center gap-4">
          {callState === "idle" && (
            <button
              type="button"
              onClick={startCall}
              className="inline-flex items-center gap-2 px-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              <PhoneCall className="h-5 w-5" />
              Call Evelyn Carter
            </button>
          )}

          {callState === "calling" && (
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 px-6 h-12 bg-slate-200 text-slate-500 font-semibold text-sm rounded-lg cursor-not-allowed"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              Connecting…
            </button>
          )}

          {callState === "in-progress" && (
            <div className="flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 px-6 h-12 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                </span>
                Call in Progress
                <span className="font-mono tabular-nums text-slate-500 ml-2">
                  {fmtTime(elapsed)}
                </span>
              </div>
              <button
                type="button"
                onClick={endCall}
                className="text-xs text-slate-500 underline hover:text-slate-700"
              >
                End Call
              </button>
            </div>
          )}

          {callState === "completed" && (
            <div className="inline-flex items-center gap-2 px-6 h-12 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Call Complete
              <span className="font-mono tabular-nums text-slate-500 ml-2">
                {fmtTime(elapsed)}
              </span>
            </div>
          )}

          {callState === "error" && (
            <div className="flex flex-col items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorMsg}
              </span>
              <button
                type="button"
                onClick={() => setCallState("idle")}
                className="text-xs text-slate-500 underline hover:text-slate-700"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Escalation alert — shown after call completes */}
      {callState === "completed" && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 border-l-4 border-l-rose-500 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-rose-900">
                ESCALATION: Symptom Flag Detected
              </div>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                Evelyn Carter reported shortness of breath during post-discharge
                follow-up call. Flagged for immediate care team review.
                Transitions RN notified.
              </p>
              <div className="text-xs text-rose-500 mt-2 tabular-nums">
                {new Date().toLocaleTimeString()} —{" "}
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
