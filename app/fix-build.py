with open("app/page.tsx", "r") as f:
    code = f.read()

# Fix 1: Remove unused variables (costSaved, costAdded, bedDays, costColor)
for var in ["const costSaved", "const costAdded", "const bedDays", "const costColor"]:
    lines = code.split("\n")
    code = "\n".join(line for line in lines if var not in line)
print("1. Removed unused cost/bed variables")

# Fix 2: Escape quotes in card labels
code = code.replace('"Clinical Stability Window"', '&quot;Clinical Stability Window&quot;')
code = code.replace('"Days vs AI Target"', '&quot;Days vs AI Target&quot;')
print("2. Escaped quotes in card labels")

with open("app/page.tsx", "w") as f:
    f.write(code)

print("DONE")
