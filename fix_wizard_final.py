#!/usr/bin/env python3
"""Apply all wizard reordering changes to BookingWizardClient.tsx in one safe pass."""
import re

with open("src/components/landing/BookingWizardClient.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

N = len(lines)
print(f"Input: {N} lines")

# ── STEP 1: Add domain validation state + helpers ──────────────────────────────
# Find the state variable line for domainName (around line 2700)
state_insert_after = None
for i, ln in enumerate(lines):
    if "const [domainName, setDomainName]" in ln or "setDomainName]" in ln:
        state_insert_after = i
        break

domain_state = """  const [domainAvailability, setDomainAvailability] = useState<"idle"|"checking"|"available"|"unavailable"|"reserved"|"invalid">("idle");
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([]);
  const [domainCheckTimer, setDomainCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function checkDomain(name: string) {
    if (!name || name.length < 3) { setDomainAvailability("idle"); return; }
    if (domainCheckTimer) clearTimeout(domainCheckTimer);
    setDomainAvailability("checking");
    setDomainSuggestions([]);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pricing/domain-check?domain=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.invalid) { setDomainAvailability("invalid"); setDomainSuggestions([]); }
        else if (data.reserved) { setDomainAvailability("reserved"); setDomainSuggestions([]); }
        else if (data.available) { setDomainAvailability("available"); }
        else { setDomainAvailability("unavailable"); setDomainSuggestions(data.suggestions || []); }
      } catch { setDomainAvailability("idle"); }
    }, 600);
    setDomainCheckTimer(timer);
  }
"""

if state_insert_after is None:
    print("WARNING: domainName state not found")
else:
    lines.insert(state_insert_after + 1, domain_state)
    N += domain_state.count("\n")
    print(f"1. Added domain validation state (after line {state_insert_after})")

# ── STEP 2: Update STEP_LABELS to 5 ────────────────────────────────────────────
for i, ln in enumerate(lines):
    if '"step1Label": "Chọn gói dịch vụ"' in ln or "step1Label" in ln and "Chọn gói" in ln:
        # Count how many step label entries follow
        step_start = i
        break

# Find and replace the STEP_LABELS array
step_labels_old = []
step_labels_new = []
in_labels = False
brace_count = 0
start_i = None

for i, ln in enumerate(lines):
    if "STEP_LABELS" in ln and "=" in ln:
        in_labels = True
        start_i = i
        brace_count = 0

    if in_labels:
        step_labels_old.append((i, ln))
        brace_count += ln.count("{") - ln.count("}")
        if brace_count == 0 and "}" in ln:
            in_labels = False

# Replace with new 5-label array
new_labels_block = """  const STEP_LABELS = [
    t("step1Label") ?? "Chọn gói dịch vụ",
    t("bookingPackage") ?? "Gói Website",
    t("bookingFeatures") ?? "Tính năng",
    t("bookingDomainHosting") ?? "Domain & Hosting",
    t("bookingContact") ?? "Thông tin liên hệ",
    t("bookingPayment") ?? "Thanh toán",
  ];
"""
# Build replacement lines preserving indentation
indent = "  "
new_lines_block = [(start_i, indent + new_labels_block)]

# Find start_i
si = step_labels_old[0][0]
ei = step_labels_old[-1][0]
old_block = "".join(l for _, l in step_labels_old)
new_block = new_lines_block[0][1]

if old_block == new_block:
    print("2. WARNING: STEP_LABELS unchanged (already correct?)")
else:
    # Replace lines
    lines = lines[:si] + [new_lines_block[0][1]] + lines[ei+1:]
    N = len(lines)
    print(f"2. Updated STEP_LABELS to 5 labels")

# ── STEP 3: Update canNext ─────────────────────────────────────────────────────
cannext_old = '    if (step === 2 && (!selectedPackage || selectedPackage === "decoy")) return false;'
cannext_new = '    if (step === 2 && (!selectedPackage || selectedPackage === "decoy")) return false;\n    if (step === 3 && domainAvailability === "checking") return false;'
if cannext_old in "".join(lines):
    # find line
    for i, ln in enumerate(lines):
        if cannext_old in ln:
            lines[i] = ln.replace(cannext_old, cannext_new)
            print("3. Updated canNext for domain checking guard")
            break
else:
    print("3. WARNING: canNext pattern not found")

# ── STEP 4: Rename StepContact → StepContactInfo in function definition ────────
for i, ln in enumerate(lines):
    if "// ── Step 3 — Contact + Payment" in ln:
        lines[i] = ln.replace("// ── Step 3 — Contact + Payment", "// ── Step 4 — Contact Info")
    if "function StepContact({" in ln:
        lines[i] = ln.replace("function StepContact({", "function StepContactInfo({")
        print("4. Renamed function StepContact → StepContactInfo")
        break

# ── STEP 5: Update StepContactInfo usage in render ─────────────────────────────
for i, ln in enumerate(lines):
    if "<StepContactInfo" in ln:
        lines[i] = ln.replace("<StepContactInfo", "<StepContactInfo")
        print("5. Updated <StepContactInfo usage in render")

# ── STEP 6: Find and remove the orphaned billing summary JSX ─────────────────
# Look for the billing placeholder inside StepContactInfo body
billing_start = None
billing_end = None
in_billing = False
for i, ln in enumerate(lines):
    if "overflow: \"hidden\"," in ln and billing_start is None:
        # Check if we're inside StepContactInfo (not in the main render)
        # Count open/close braces to verify
        billing_start = i
    if billing_start and "Billing summary — edit via Admin" in ln:
        billing_end = i
        break

if billing_start and billing_end:
    # Remove lines billing_start through billing_end+1 (closing </div>)
    removed = billing_end - billing_start + 1
    lines = lines[:billing_start] + lines[billing_end+1:]
    N = len(lines)
    print(f"6. Removed {removed} orphaned billing summary lines")
else:
    print("6. WARNING: billing summary block not found")

# ── STEP 7: Update render to show only ContactInfo (no domain/hosting step yet) ──
# The current render shows step-based layout. We just need to verify the
# render uses <StepContactInfo> and has no stray billing JSX.
# The main render switch/if blocks are untouched.

print(f"\nTotal output: {len(lines)} lines")
with open("src/components/landing/BookingWizardClient.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("File written")
