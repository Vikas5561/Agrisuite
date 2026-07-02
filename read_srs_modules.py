import re

with open('srs_extracted.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# let's find references to Module 09, 10, 11, 12, 13, 14, 15, 16, 17, 18
modules = [
    ("Module 09", 2996),
    ("Module 10", 3337),
    ("Module 11", 3739),
    ("Module 12", 4097),
    ("Module 13", 4497),
    ("Module 14", 4844),
    ("Module 15", 5161),
    ("Module 16", 5519),
    ("Module 17", 5832),
    ("Module 18", 6233)
]

# let's extract the text block for each module (e.g. from the module line to the next module line)
lines = text.split('\n')
for idx, (mod_name, line_num) in enumerate(modules):
    start_line = line_num - 1
    end_line = modules[idx+1][1] - 1 if idx + 1 < len(modules) else len(lines)
    
    print(f"=== {mod_name} (Lines {start_line+1} to {end_line}) ===")
    mod_text = '\n'.join(lines[start_line:start_line+25]) # print first 25 lines
    print(mod_text)
    print("\n" + "="*40 + "\n")
