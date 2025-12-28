import os

env_file = '.env'
new_token = 'REPLICATE_API_TOKEN=r8_aLm25h7kLr2wXDdQwSEpVyvwugfgUpK0YV2Sv'
lines = []

if os.path.exists(env_file):
    with open(env_file, 'r') as f:
        lines = f.readlines()

new_lines = []
token_found = False

for line in lines:
    if line.startswith('REPLICATE_API_TOKEN='):
        new_lines.append(new_token + '\n')
        token_found = True
    else:
        new_lines.append(line)

if not token_found:
    if new_lines and not new_lines[-1].endswith('\n'):
        new_lines[-1] += '\n'
    new_lines.append(new_token + '\n')

with open(env_file, 'w') as f:
    f.writelines(new_lines)

print("Updated .env successfully")
