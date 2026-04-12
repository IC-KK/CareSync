import re

with open("app/page.tsx", "r") as f:
    code = f.read()

changes = 0

# FIX 1: Replace Cost Saved and Bed-Days cards with clinical language
# Find the Cost Saved card
old_cost = '''<div className="text-center">
                <p className="text-sm text-muted-foreground">Cost Saved</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-red-600"}`}>
                  {diff <= 0 ? `$${Math.round(Math.abs(diff) * 2800).toLocaleString()}` : `-$${Math.round(diff * 2800).toLocaleString()}`}
                </p>
              </div>'''

new_clinical = '''<div className="text-center">
                <p className="text-sm text-muted-foreground">Clinical Stability Window</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-amber-600"}`}>
                  {diff <= 0 ? "Within Window" : "Extended"}
                </p>
              </div>'''

if old_cost in code:
    code = code.replace(old_cost, new_clinical)
    changes += 1
    print("1. Replaced Cost Saved with Clinical Stability Window")
else:
    print("1. SKIP: Cost Saved card not found (may already be fixed or different formatting)")

# FIX 1b: Replace Bed-Days card
old_bed = '''<div className="text-center">
                <p className="text-sm text-muted-foreground">Bed-Days Recovered</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-red-600"}`}>
                  {diff <= 0 ? Math.abs(diff).toFixed(1) : `+${diff.toFixed(1)}`}
                </p>
              </div>'''

new_target = '''<div className="text-center">
                <p className="text-sm text-muted-foreground">Days vs AI Target</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-amber-600"}`}>
                  {diff === 0 ? "On Target" : diff < 0 ? `${Math.abs(diff).toFixed(1)}d early` : `${diff.toFixed(1)}d over`}
                </p>
              </div>'''

if old_bed in code:
    code = code.replace(old_bed, new_target)
    changes += 1
    print("2. Replaced Bed-Days Recovered with Days vs AI Target")
else:
    print("2. SKIP: Bed-Days card not found (may already be fixed or different formatting)")

# FIX 2: Replace Python True/False with JS true/false in scenario planning
if ", True]" in code or ", False]" in code:
    code = code.replace(", True]", ", true]").replace(", False]", ", false]")
    changes += 1
    print("3. Fixed Python True/False -> JS true/false in scenario planning")
else:
    print("3. SKIP: No Python True/False found")

with open("app/page.tsx", "w") as f:
    f.write(code)

print(f"\nDONE: {changes} change(s) applied")
