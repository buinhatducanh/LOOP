#!/usr/bin/env python3
"""Fix orphaned billing JSX in BookingWizardClient.tsx — line-based approach"""
with open('src/components/landing/BookingWizardClient.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

changes = 0

# Identify lines to remove (0-indexed):
# Line 2476: blank
# Line 2477:         {/* ── Right: billing summary (sticky) ── */}
# Line 2478: blank
# Line 2479: // ── Step 8 — Payment ──────────────────────────────────────
# Line 2480:         </div>   ← extra closing div — remove
# Line 2481: blank

# Build new lines: keep 0-2475, skip 2476-2481, keep 2482 onwards
new_lines = lines[:2476] + lines[2482:]  # skip lines 2476-2481 (6 lines)

changes = len(lines) - len(new_lines)
print(f"Removed {changes} orphaned lines (2476-2481)")

with open('src/components/landing/BookingWizardClient.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File written")
print(f"Old line count: {len(lines)}, New line count: {len(new_lines)}")
