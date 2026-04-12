import re

with open("app/page.tsx", "r") as f:
    code = f.read()

changes = 0

# Fix 1: Replace Cost Saved card
old1 = '''{diff <= 0 ? "Cost Saved" : "Added Cost"}
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", costColor)}>
              ${(diff <= 0 ? costSaved : costAdded).toLocaleString()}'''

new1 = '''"Clinical Stability Window"
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", diff <= 0 ? "text-green-600" : "text-amber-600")}>
              {diff <= 0 ? "Within Window" : "Extended"}'''

if old1 in code:
    code = code.replace(old1, new1)
    changes += 1
    print("1. Replaced Cost Saved with Clinical Stability Window")
else:
    print("1. SKIP: Cost Saved not found")

# Fix 2: Replace Bed-Days card
old2 = '''Bed-Days {diff <= 0 ? "Recovered" : "Used"}
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", diff <= 0 ? "text-indigo-600" : "text-slate-400")}>
              {diff <= 0 ? "+" : "-"}{bedDays.toFixed(1)}'''

new2 = '''"Days vs AI Target"
            </div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", diff <= 0 ? "text-green-600" : "text-amber-600")}>
              {diff === 0 ? "On Target" : diff < 0 ? `${Math.abs(diff).toFixed(1)}d early` : `${diff.toFixed(1)}d over`}'''

if old2 in code:
    code = code.replace(old2, new2)
    changes += 1
    print("2. Replaced Bed-Days with Days vs AI Target")
else:
    print("2. SKIP: Bed-Days not found")

# Fix 3: Unicode escapes
code = code.replace('\\u2014', '\u2014')
code = code.replace('\\u25b2', '\u25b2')
print("3. Fixed unicode escapes")

with open("app/page.tsx", "w") as f:
    f.write(code)

print(f"\nDONE: {changes} change(s) applied")
