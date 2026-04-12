import re

# Read backup (original) and current file
with open("app/page.tsx.backup", "r") as f:
    backup = f.read()
with open("app/page.tsx", "r") as f:
    current = f.read()

# Extract original DigitalTwin from backup
match_old = re.search(r'(function DigitalTwin\(.*?\n)(.*?)((?=\nfunction )|(?=\nexport ))', backup, re.DOTALL)
if not match_old:
    print("ERROR: Could not find DigitalTwin in backup")
    exit(1)
original_twin = match_old.group(0)

# Extract current DigitalTwin from current file
match_new = re.search(r'(function DigitalTwin\(.*?\n)(.*?)((?=\nfunction )|(?=\nexport ))', current, re.DOTALL)
if not match_new:
    print("ERROR: Could not find DigitalTwin in current file")
    exit(1)
current_twin = match_new.group(0)

# Replace
current = current.replace(current_twin, original_twin)

with open("app/page.tsx", "w") as f:
    f.write(current)

print("SUCCESS: Original Digital Twin restored (keeps Executive Dashboard)")
