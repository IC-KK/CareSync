import re

with open("app/page.tsx.backup", "r") as f:
    backup = f.read()
with open("app/page.tsx", "r") as f:
    current = f.read()

# Extract TwinField from backup
match = re.search(r'(function TwinField\(.*?\n)(.*?)((?=\nfunction )|(?=\nexport ))', backup, re.DOTALL)
if not match:
    print("ERROR: TwinField not found in backup")
    exit(1)

twinfield = match.group(0)

# Insert before function DigitalTwin
current = current.replace("function DigitalTwin(", twinfield + "\nfunction DigitalTwin(")

with open("app/page.tsx", "w") as f:
    f.write(current)

print("SUCCESS: TwinField component added")
