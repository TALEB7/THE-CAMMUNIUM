import re

with open(r"c:\Users\PC\Desktop\THE-COMMUNIUM-main\stage_pfe\main.tex", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')

for i, line in enumerate(lines):
    if "\\begin{table}" in line:
        print(f"Table start at line {i+1}: {line}")
