with open('srs_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# let's search for "Database Tables" and print the next 40 lines
lines = text.split('\n')
for i, line in enumerate(lines):
    if "database tables" in line.lower() or "database schema" in line.lower() or "table fields" in line.lower():
        print(f"Line {i+1}: {line}")
        print('\n'.join(lines[i:i+40]))
        print("\n" + "="*40 + "\n")
