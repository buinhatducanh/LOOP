"use client";

import { Check, X } from "lucide-react";
import {
  type WebPackage,
  type FeatureCategory,
  formatVND,
} from "@/data/pricingPackages";

interface FeatureComparisonTableProps {
  packages: WebPackage[];
  categories: FeatureCategory[];
  locale: string;
}

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "rgba(34,197,94,0.2)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Check size={12} color="#22C55E" />
      </div>
    );
  }
  if (value === false) {
    return (
      <div
        style={{
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={12} color="#4B5563" />
      </div>
    );
  }

  // String value — detect "Miễn phí" / "Free"
  const strVal = String(value ?? "").trim();
  const isFree = /^mi[ễe]n\s*ph[ií]/i.test(strVal);

  if (isFree) {
    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "9999px",
          fontSize: "11px",
          fontWeight: 700,
          background: "rgba(245,158,11,0.15)",
          color: "#FCD34D",
          border: "1px solid rgba(245,158,11,0.25)",
          letterSpacing: "0.02em",
        }}
      >
        🆓 {strVal}
      </span>
    );
  }

  return (
    <span style={{ color: "#E2E8F0", fontSize: "13px", fontWeight: 500 }}>
      {value}
    </span>
  );
}

export function FeatureComparisonTable({
  packages,
  categories,
  locale,
}: FeatureComparisonTableProps) {
  const isVi = locale === "vi";

  return (
    <div className="animate-fade-in">
      <div
        style={{
          overflowX: "auto",
          borderRadius: "16px",
          border: "1px solid #1F2937",
          background: "#0F172A",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "700px",
            borderCollapse: "collapse",
          }}
        >
          {/* Header */}
          <thead>
            <tr>
              <th
                style={{
                  position: "sticky",
                  left: 0,
                  zIndex: 10,
                  background: "#0F172A",
                  padding: "20px 24px",
                  textAlign: "left",
                  borderBottom: "1px solid #1F2937",
                  minWidth: "200px",
                }}
              >
                <span
                  style={{
                    color: "#94A3B8",
                    fontSize: "13px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  {isVi ? "Tính năng" : "Features"}
                </span>
              </th>
              {packages.map((pkg) => (
                <th
                  key={pkg.id}
                  style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    borderBottom: "1px solid #1F2937",
                    borderLeft: "1px solid #1F2937",
                    background: pkg.highlighted
                      ? "rgba(99,102,241,0.1)"
                      : "transparent",
                    minWidth: "130px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: pkg.highlighted ? "#A5B4FC" : "#94A3B8",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: "6px",
                    }}
                  >
                    {isVi ? pkg.nameVi : pkg.name}
                  </div>
                  <div
                    style={{
                      fontSize: "clamp(16px, 2vw, 20px)",
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    {formatVND(pkg.price)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {categories.map((category) => (
              <>
                {/* Category Header Row */}
                <tr key={`cat-${category.id}`}>
                  <td
                    colSpan={packages.length + 1}
                    style={{
                      padding: "14px 24px",
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))",
                      borderBottom: "1px solid #1F2937",
                      borderTop: "1px solid #1F2937",
                    }}
                  >
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: "14px",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {isVi ? category.nameVi : category.name}
                    </span>
                  </td>
                </tr>

                {/* Feature Rows */}
                {category.features.map((feature) => (
                  <tr
                    key={feature.id}
                    style={{ transition: "background 0.15s" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <td
                      style={{
                        position: "sticky",
                        left: 0,
                        zIndex: 5,
                        background: "#0F172A",
                        padding: "14px 24px",
                        borderBottom: "1px solid rgba(31,41,55,0.5)",
                        color: "#CBD5E1",
                        fontSize: "14px",
                      }}
                    >
                      {isVi ? feature.nameVi : feature.name}
                    </td>
                    {packages.map((pkg) => (
                      <td
                        key={`${feature.id}-${pkg.id}`}
                        style={{
                          padding: "14px 16px",
                          textAlign: "center",
                          borderBottom: "1px solid rgba(31,41,55,0.5)",
                          borderLeft: "1px solid rgba(31,41,55,0.5)",
                          background: pkg.highlighted
                            ? "rgba(99,102,241,0.05)"
                            : "transparent",
                        }}
                      >
                        <CellValue value={feature.values[pkg.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
