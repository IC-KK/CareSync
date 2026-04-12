import re

with open("app/page.tsx", "r") as f:
    content = f.read()

changes = 0

# === 1. REPLACE EXEC PLACEHOLDER ===
old_exec = """              {activeTab === "exec" && (
                <Card className="p-8 border-dashed border-slate-300 bg-white">
                  <div className="text-sm text-slate-400">
                    [Executive] content for {selected.full_name} — coming in a
                    later phase. Role: {role}.
                  </div>
                </Card>
              )}"""

new_exec = """              {activeTab === "exec" && (
                <ExecutiveDashboard role={role} />
              )}"""

if old_exec in content:
    content = content.replace(old_exec, new_exec)
    changes += 1
    print("1. Exec placeholder replaced")
else:
    print("1. SKIP: exec placeholder not found (may already be done)")

# === 2. ADD EXECUTIVE DASHBOARD COMPONENT ===
exec_component = '''
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
    { metric: "Avg LOS (HF, DRG 291)", pre: "6.3 days", now: "4.5 days", change: "\\u25bc 1.8d" },
    { metric: "Avg excess days", pre: "2.1 days", now: "0.3 days", change: "\\u25bc 85%" },
    { metric: "Discharge before noon", pre: "22%", now: "41%", change: "\\u25b2 86%" },
    { metric: "Barrier detection", pre: "Manual / missed", now: "Auto, < 1 min", change: "\\u25b2 New" },
    { metric: "Barrier resolution", pre: "6.8h avg", now: "3.1h avg", change: "\\u25bc 54%" },
    { metric: "30-day readmission", pre: "18.7%", now: "14.2%", change: "\\u25bc 4.5 pts" },
    { metric: "Post-DC engagement", pre: "0%", now: "91%", change: "\\u25b2 New" },
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
        <h1 className="text-2xl font-semibold mt-1">CareSync ROI \\u2014 Cardiac Unit Pilot</h1>
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
            <div className="text-[10px] font-semibold text-emerald-600 mt-1">\\u25b2 {m.delta}</div>
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
            {[["If barriers resolved 1h faster on avg", "+$218K/yr", True], ["If readmission drops another 2 pts", "+$91K/yr", True], ["If expanded to Medicine unit (48 beds)", "+$1.4M/yr", True], ["If pilot fails to reduce LOS", "-$380K (cost only)", False]].map((s, i) => (
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
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Operational Comparison \\u2014 Pilot Unit</h3>
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

'''

if "ExecutiveDashboard" not in content or "Executive Access Required" not in content:
    marker = "type CallState"
    idx = content.find(marker)
    if idx == -1:
        print("2. ERROR: Could not find insertion point for ExecutiveDashboard")
        exit(1)
    content = content[:idx] + exec_component + "\n" + content[idx:]
    changes += 1
    print("2. ExecutiveDashboard component added")
else:
    print("2. SKIP: ExecutiveDashboard already exists")

# === 3. DYNAMIC LOCK ICON ===
old_lock = """{t.label}
                  {"locked" in t && t.locked && (
                    <Lock className="h-3.5 w-3.5" />
                  )}"""

new_lock = """{t.label}
                  {"locked" in t && t.locked && (
                    role === "COO"
                      ? <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                      : <Lock className="h-3.5 w-3.5" />
                  )}"""

if old_lock in content:
    content = content.replace(old_lock, new_lock)
    changes += 1
    print("3. Lock icon made dynamic")
else:
    print("3. SKIP: lock icon pattern not found")

# === 4. FIX SCENARIO PLANNING TSX SYNTAX ===
# The Python True/False in .map needs to be fixed for TSX
content = content.replace(
    '].map((s, i) => (\n              <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">\n                <span className="text-slate-600">{s[0] as string}</span>\n                <span className={s[2] ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{s[1] as string}</span>',
    '].map((s, i) => (\n              <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-100 last:border-0">\n                <span className="text-slate-600">{s[0] as string}</span>\n                <span className={s[2] ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{s[1] as string}</span>'
)

with open("app/page.tsx", "w") as f:
    f.write(content)

print(f"DONE: {changes} changes applied")
