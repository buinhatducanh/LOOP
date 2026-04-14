#!/usr/bin/env python3
with open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'r', encoding='utf-8') as f:
 content = f.read()

idx = content.find('KPI Bar')
print('KPI Bar at:', idx)
if idx >= 0:
 print(repr(content[idx-5:idx+150]))
