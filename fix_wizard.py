#!/usr/bin/env python3
"""Apply targeted edits to BookingWizardClient.tsx"""
import re

with open('src/components/landing/BookingWizardClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# 1. Add domain validation state
old1 = "  // LP balance — fetched from /api/pricing/config?email= when customer enters email\n  const [lpBalance, setLpBalance] = useState(0);"
new1 = """  // LP balance — fetched from /api/pricing/config?email= when customer enters email
  const [lpBalance, setLpBalance] = useState(0);

  // ── Domain validation ──────────────────────────────────────────────────
  const [domainValidation, setDomainValidation] = useState<"idle"|"checking"|"available"|"unavailable"|"invalid">("idle");
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([]);

  const isValidDomainFormat = (name: string): boolean => {
    if (!name || name.length < 2) return false;
    return /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$|^[a-z0-9]$/i.test(name.split(".")[0] ?? "");
  };

  const checkDomainAvailability = async (name: string) => {
    try {
      const r = await fetch(`/api/pricing/domain-check?domain=${encodeURIComponent(name)}`);
      if (r.ok) return r.json();
    } catch { /* fall through */ }
    const blocked = [".gov.vn",".edu.vn",".org.vn",".mil.vn"];
    if (blocked.some(s => name.toLowerCase().endsWith(s))) return { available: false, invalid: true, suggestions: [] };
    const taken = ["google.com","facebook.com","loop.vn"];
    if (taken.some(t => name.toLowerCase().endsWith(t))) return { available: false, invalid: false, suggestions: [] };
    return { available: true, invalid: false, suggestions: [] };
  };

  useEffect(() => {
    if (!domainName.includes(".")) { setDomainValidation("idle"); setDomainSuggestions([]); return; }
    const base = domainName.split(".")[0] ?? "";
    if (base.length < 2) { setDomainValidation("idle"); setDomainSuggestions([]); return; }
    if (!isValidDomainFormat(domainName)) { setDomainValidation("invalid"); setDomainSuggestions([]); return; }
    setDomainValidation("checking");
    checkDomainAvailability(domainName).then(r => {
      if (r.invalid) { setDomainValidation("invalid"); setDomainSuggestions([]); }
      else if (r.available) { setDomainValidation("available"); setDomainSuggestions([]); }
      else { setDomainValidation("unavailable"); setDomainSuggestions(r.suggestions ?? []); }
    });
  }, [domainName]);"""

if old1 in content:
    content = content.replace(old1, new1)
    changes += 1
    print("1. Added domain validation state")
else:
    print("WARNING: domain state marker not found")

# 2. Update STEP_LABELS
old2 = """  const STEP_LABELS = [
    t("bookingPackage"),  // Step 0: Package selection
    t("bookingAddons"),  // Step 1: Add-ons
    t("bookingContact"),  // Step 2: Contact + Payment
  ];"""
new2 = """  const STEP_LABELS = [
    t("bookingPackage"),
    t("bookingFeatures"),
    t("bookingDomainHosting"),
    t("bookingContact"),
    t("bookingPayment"),
  ];"""
if old2 in content:
    content = content.replace(old2, new2)
    changes += 1
    print("2. Updated STEP_LABELS")
else:
    print("WARNING: STEP_LABELS not found")

# 3. Update canNext
old3 = """  const canNext = () => {
    if (step === 0) return !!selectedPackage;  // must select a package
    if (step === 1) return true;  // features + hosting are optional
    if (step === 2) return true;  // contact info validated server-side
    return true;
  };"""
new3 = """  const canNext = () => {
    if (step === 0) return !!selectedPackage;
    if (step === 1) return true;
    if (step === 2) return true;
    if (step === 3) return !!(name.trim() && email.trim());
    return true;
  };"""
if old3 in content:
    content = content.replace(old3, new3)
    changes += 1
    print("3. Updated canNext")
else:
    print("WARNING: canNext not found")

# 4. Rename StepContact → StepContactInfo (function definition)
old4 = "// ── Step 3 — Contact + Payment ─────────────────────────────────────────────────\nfunction StepContact({"
new4 = "// ── Step 4 — Contact Info ─────────────────────────────────────────────────────\nfunction StepContactInfo({"
if old4 in content:
    content = content.replace(old4, new4)
    changes += 1
    print("4. Renamed StepContact function definition")
else:
    print("WARNING: StepContact function def not found")

# 5. Replace StepContact in render with StepContactInfo
old5 = "          <StepContact\n            vatRate={vatRate}"
new5 = "          <StepContactInfo\n            vatRate={vatRate}"
if old5 in content:
    content = content.replace(old5, new5)
    changes += 1
    print("5. Updated StepContact usage in render")
else:
    print("WARNING: StepContact usage not found")

# 6. Remove billing summary right column from StepContactInfo
# Find and remove the billing summary column (lines after the LP redemption closing </div>)
old6 = """          <div style={{ color: DS.text5, fontSize: 11, marginTop: 10, textAlign: "center" }}>
            {paymentPlan === "100" ? "Thanh toán 100% ngay — giảm 5%." : t("depositNote")}
          </div>
        </div>

        {/* ── Right: billing summary (sticky) ── */}
        <div>
          <div style={{
            background: "rgba(10,15,30,0.95)",
            border: `1px solid ${pkgColor}30`,
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: `0 0 40px ${pkgColor}10, 0 8px 32px rgba(0,0,0,0.5)`,
            position: "sticky",
            top: 24,
          }}>
            {/* Hero header */}
            <div style={{
              background: `linear-gradient(135deg, ${pkgColor}18 0%, rgba(15,23,42,0.95) 100%)`,
              borderBottom: `1px solid ${pkgColor}20`,
              padding: "20px",
            }}>
              <div style={{ color: pkgColor, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.2em", marginBottom: 4 }}>TÓM TẮT ĐƠN HÀNG</div>
              <div style={{ color: DS.text, fontFamily: DS.heading, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{fmtVND(grandTotal)}</div>
              {(selectedPackage) && (
                <div style={{ color: pkgColor, fontSize: 11, fontFamily: DS.mono, marginTop: 2 }}>{selectedPackage.name} · {pkgColor === DS.pink ? "◈ HOT" : ""}</div>
              )}
            </div>

            {/* Line items */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: DS.text3, fontSize: 10, fontFamily: DS.mono, letterSpacing: "0.1em", marginBottom: 8 }}>CHI TIẾT</div>
                <div className="space-y-2">
                  {basePrice > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full" style={{ background: pkgColor }} /><span style={{ color: DS.text3, fontSize: 12 }}>{selectedPackage?.name ?? "Website"}</span></div>
                      <span style={{ color: pkgColor, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(basePrice)}</span>
                    </div>
                  )}
                  {featurePrices > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DS.blue }} /><span style={{ color: DS.text3, fontSize: 12 }}>Tính năng ({selectedFeatures.length})</span></div>
                      <span style={{ color: DS.blue, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(featurePrices)}</span>
                    </div>
                  )}
                  {extraPrices > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DS.amber }} /><span style={{ color: DS.text3, fontSize: 12 }}>Dịch vụ ({selectedExtras.length})</span></div>
                      <span style={{ color: DS.amber, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(extraPrices)}</span>
                    </div>
                  )}
                  {hostingCost > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DS.purple }} /><span style={{ color: DS.text3, fontSize: 12 }}>{hosting?.name ?? "Hosting"}</span></div>
                      <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(hostingCost)}</span>
                    </div>
                  )}
                  {domainCost > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DS.teal }} /><span style={{ color: DS.text3, fontSize: 12 }}>Domain {domainName}</span></div>
                      <span style={{ color: DS.teal, fontSize: 12, fontFamily: DS.mono }}>+{fmtVND(domainCost)}</span>
                    </div>
                  )}
                  {subtotal > 0 && (
                    <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                      <span style={{ color: DS.text3, fontSize: 12 }}>Tạm tính</span>
                      <span style={{ color: DS.text, fontSize: 12, fontFamily: DS.mono, fontWeight: 600 }}>{fmtVND(subtotal)}</span>
                    </div>
                  )}
                  {lpApplied.vndDiscount > 0 && (
                    <div
                      className="flex justify-between items-center p-2 rounded-lg"
                      style={{ background: `${DS.purple}10`, border: `1px solid ${DS.purple}20` }}
                    >
                      <span style={{ color: DS.purple, fontSize: 12 }}>◈ Giảm LP ({lpApplied.lpUsed.toLocaleString()} LP)</span>
                      <span style={{ color: DS.purple, fontSize: 12, fontFamily: DS.mono }}>−{fmtVND(lpApplied.vndDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2" style={{ borderTop: `1px solid ${DS.border}` }}>
                    <span style={{ color: DS.text, fontSize: 13, fontWeight: 700 }}>Thành tiền</span>
                    <span style={{ color: pkgColor, fontSize: 15, fontFamily: DS.mono, fontWeight: 700 }}>{fmtVND(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Deposit */}
              <div style={{ margin: "0 20px 20px", padding: "14px 16px", borderRadius: 14, background: `linear-gradient(135deg, ${pkgColor}12 0%, rgba(15,23,42,0.8) 100%)`, border: `1px solid ${pkgColor}25` }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div style={{ color: DS.text, fontSize: 11, fontFamily: DS.mono, fontWeight: 700, marginBottom: 2 }}>
                      {paymentPlan === "100" ? "Thanh toán ngay" : "Đặt cọc"}
                    </div>
                    <div style={{ color: DS.text4, fontSize: 10 }}>Phần còn lại thanh toán khi bàn giao</div>
                  </div>
                  <span style={{ color: pkgColor, fontFamily: DS.heading, fontSize: 18, fontWeight: 900 }}>{fmtVND(depositAmount)}</span>
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${(depositPct * 100)}%`, background: GRD.primary, borderRadius: 2 }} />
                </div>
                <div style={{ color: DS.text5, fontSize: 10, fontFamily: DS.mono }}>
                  {paymentPlan === "100" ? "Phần còn lại: 0đ" : `Phần còn lại: ${fmtVND(grandTotal - depositAmount)}`}
                </div>
              </div>

              {/* LP earned */}
              {lpEarned > 0 && (
                <div style={{ margin: "0 20px 20px", padding: "12px 14px", borderRadius: 12, background: `linear-gradient(135deg, ${DS.purple}12 0%, ${DS.pink}06 100%)`, border: `1px solid ${DS.purple}25` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${DS.purple}20` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={DS.purple} stroke="none">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ color: DS.purple, fontSize: 9, fontFamily: DS.mono, letterSpacing: "0.15em", marginBottom: 2 }}>LP THƯỞNG KHI HOÀN THÀNH</div>
                      <div style={{ color: DS.purple, fontFamily: DS.heading, fontSize: 18, fontWeight: 700 }}>
                        +{lpEarned.toLocaleString()} <span style={{ fontSize: 10, fontFamily: DS.mono, fontWeight: 400 }}>LP</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}"""

# Use simpler replacement: just remove the right column billing summary
# Find the pattern in StepContactInfo's return
# Pattern: after LP redemption section, there's a closing </div> then billing summary
old6a = """          <div style={{ color: DS.text5, fontSize: 11, marginTop: 10, textAlign: "center" }}>
            {paymentPlan === "100" ? "Thanh toán 100% ngay — giảm 5%." : t("depositNote")}
          </div>
        </div>

        {/* ── Right: billing summary (sticky) ── */}
        <div>
          <div style={{
            background: "rgba(10,15,30,0.95)","""

new6a = """          <div style={{ color: DS.text5, fontSize: 11, marginTop: 10, textAlign: "center" }}>
            {paymentPlan === "100" ? "Thanh toán 100% ngay — giảm 5%." : t("depositNote")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 5 — Payment ──────────────────────────────────────────────────────────

function StepPayment({"""

if old6a in content:
    content = content.replace(old6a, new6a)
    changes += 1
    print("6. Removed billing summary from StepContactInfo")
else:
    print("WARNING: billing summary marker not found")
    # Try alternate whitespace
    idx = content.find("TÓM TẮT ĐƠN HÀNG")
    if idx != -1:
        print(f"  Found 'TÓM TẮT ĐƠN HÀNG' at index {idx}")
        # Cut from there back to the paymentPlan div
        start = content.rfind("          <div style={{ color: DS.text5, fontSize: 11, marginTop: 10, textAlign: \"center\" }}>", 0, idx)
        print(f"  Start marker at {start}")

# 7. Add StepPayment function after StepContactInfo closes
# The StepPayment function will be added via the replacement above
# Just need to insert it between StepContactInfo and SECTION 6

# 8. Replace entire SECTION 6 + SECTION 2/3/4a/4b/5 with step-based sections
# This is the complex part - let's find and replace the old render section

# OLD section pattern (everything between SECTION 3 and end of StepContact in render)
# Find "SECTION 3: Feature Toggle Table" and replace to end

# But first, let's do a simpler targeted replacement: replace the whole block
# from SECTION 3 onward

print(f"\nTotal changes applied: {changes}")

with open('src/components/landing/BookingWizardClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("File written")
