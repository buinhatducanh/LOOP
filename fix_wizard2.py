#!/usr/bin/env python3
"""Fix remaining issues in BookingWizardClient.tsx after fix_wizard.py"""
import re

with open('src/components/landing/BookingWizardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Rename StepContact function definition -> StepContactInfo
old1 = '// ── Step 3 — Contact + Payment ─────────────────────────────────────────────────\n\nfunction StepContact({'
new1 = '// ── Step 4 — Contact Info ─────────────────────────────────────────────────────\n\nfunction StepContactInfo({'
if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print('1. Renamed StepContact -> StepContactInfo (function def)')
else:
    print('WARNING: StepContact function def not found')

# 2. Remove orphaned billing summary JSX + _StepPayment stub
old2 = '''        </div>

        {/* ── Right: billing summary (sticky) ── }

// ── Step 8 — Payment ──────────────────────────────────────────────────────────

function _StepPayment({'''

new2 = '''        </div>

// ── _StepPayment stub (unused, to be removed) ────────────────────────────────

function _StepPayment({'''

if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print('2. Fixed orphaned billing + Step 8 marker')
else:
    print('WARNING: orphaned billing summary not found')

# 3. Delete the _StepPayment stub entirely
# Find it between 'function _StepPayment({' and '// ── Main BookingWizardClient'
stepayment_match = re.search(
    r'// ── _StepPayment stub.*?function _StepPayment\(.*?\n\}',
    content,
    re.DOTALL
)
if stepayment_match:
    content = content[:stepayment_match.start()] + content[stepayment_match.end():]
    changes += 1
    print('3. Removed _StepPayment stub')
else:
    print('WARNING: _StepPayment stub not found by regex')

print(f'\nTotal additional changes: {changes}')
with open('src/components/landing/BookingWizardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('File written')
