import re

with open('src/app/admin/orders/page.tsx', 'r', encoding='utf-8') as f:
 content = f.read()

# Fix: backslash-backtick -> backtick
content = content.replace(chr(92) + chr(96), chr(96))
# Fix: backslash-dollar-brace -> dollar-brace in DS.border context
content = content.replace(chr(92) + '${DS.border}', '${DS.border}')

with open('src/app/admin/orders/page.tsx', 'w', encoding='utf-8') as f:
 f.write(content)

print('Done')

# Verify
with open('src/app/admin/orders/page.tsx', 'r', encoding='utf-8') as f:
 lines = f.readlines()

print('Line 900:', repr(lines[899]))
print('Line 919:', repr(lines[918]))
