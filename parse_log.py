import json

with open('line33.txt', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

code_content = data['tool_calls'][0]['args']['CodeContent']

with open('old_plan.md', 'w', encoding='utf-8') as f:
    f.write(code_content)
