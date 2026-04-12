import re

with open("app/page.tsx", "r") as f:
    code = f.read()

changes = 0

# Fix 1: Replace "Cost Saved" card with "Clinical Stability Window"
pattern1 = r'<p className="text-sm text-muted-foreground">Cost Saved</p>\s*<p className=\{[^}]+\}>\s*\{[^}]+\$[^}]+\}\s*</p>'
replacement1 = '''<p className="text-sm text-muted-foreground">Clinical Stability Window</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-amber-600"}`}>
                  {diff <= 0 ? "Within Window" : "Extended"}
                </p>'''

if re.search(pattern1, code, re.DOTALL):
    code = re.sub(pattern1, replacement1, code, flags=re.DOTALL)
    changes += 1
    print("1. Replaced Cost Saved with Clinical Stability Window")
else:
    print("1. SKIP: Cost Saved not found")

# Fix 2: Replace "Bed-Days Recovered" card with "Days vs AI Target"
pattern2 = r'<p className="text-sm text-muted-foreground">Bed-Days Recovered</p>\s*<p className=\{[^}]+\}>\s*\{[^}]+\}\s*</p>'
replacement2 = '''<p className="text-sm text-muted-foreground">Days vs AI Target</p>
                <p className={`text-2xl font-bold ${diff <= 0 ? "text-green-600" : "text-amber-600"}`}>
                  {diff === 0 ? "On Target" : diff < 0 ? `${Math.abs(diff).toFixed(1)}d early` : `${diff.toFixed(1)}d over`}
                </p>'''

if re.search(pattern2, code, re.DOTALL):
    code = re.sub(pattern2, replacement2, code, flags=re.DOTALL)
    changes += 1
    print("2. Replaced Bed-Days Recovered with Days vs AI Target")
else:
    print("2. SKIP: Bed-Days Recovered not found")

# Fix 3: Unicode escapes showing as literal text
code = code.replace(r'\u2014', '\u2014')
code = code.replace(r'\u25b2', '\u25b2')
changes += 1
print("3. Fixed unicode escapes (em dash + triangle)")

with open("app/page.tsx", "w") as f:
    f.write(code)

print(f"\nDONE: {changes} change(s) applied")
