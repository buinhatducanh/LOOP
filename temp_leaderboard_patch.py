#!/usr/bin/env python3
content = open('D:/LOOP_COMPANY/LOOP/src/app/admin/leaderboard_admin/page.tsx', 'r', encoding='utf-8').read()
lines = content.split('\n')

kpi_line_idx = None
for i, line in enumerate(lines):
 if '{/* KPI Bar */}' in line:
 kpi_line_idx = i
 break

show_more_line = None
for i, line in enumerate(lines):
 if 'Hiển thêm' in line and 'entries.length - showTop' in line:
 show_more_line = i
 break

award_modal_line = None
for i, line in enumerate(lines):
 if '{/* Award Modal */}' in line:
 award_modal_line = i
 break

print(f"KPI: {kpi_line_idx+1}, ShowMore: {show_more_line+1}, AwardModal: {award_modal_line+1}")
