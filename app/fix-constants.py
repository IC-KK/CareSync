import re

with open("app/page.tsx.backup", "r") as f:
    backup = f.read()
with open("app/page.tsx", "r") as f:
    current = f.read()

# Find all constants referenced by DigitalTwin in backup
constants = []
for name in ["SEVERITY_OPTIONS", "ROM_OPTIONS", "ADMISSION_TYPE_OPTIONS", "GENDER_OPTIONS", "RACE_OPTIONS", "ETHNICITY_OPTIONS"]:
    pattern = rf'const {name}\s*=\s*\[.*?\];'
    match = re.search(pattern, backup, re.DOTALL)
    if match:
        constants.append(match.group(0))
        print(f"Found: {name}")
    else:
        print(f"Not found: {name}")

if constants:
    # Insert all constants before function TwinField
    insert_block = "\n\n".join(constants) + "\n\n"
    current = current.replace("function TwinField(", insert_block + "function TwinField(")
    
    with open("app/page.tsx", "w") as f:
        f.write(current)
    print(f"\nSUCCESS: Added {len(constants)} constant(s)")
else:
    print("\nERROR: No constants found in backup")
