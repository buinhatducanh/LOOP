"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition, useState, useRef, useEffect } from "react";
import { trackLanguageSwitch } from "@/lib/analytics/events";

const locales = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳", flagUrl: "https://flagcdn.com/w40/vn.png" },
    { code: "en", label: "English", flag: "🇺🇸", flagUrl: "https://flagcdn.com/w40/us.png" },
];

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const ref = useRef<HTMLDivElement>(null);

    const current = locales.find((l) => l.code === locale) || locales[0];

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleLocaleChange = (newLocale: string) => {
        trackLanguageSwitch(locale, newLocale);
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
            router.refresh();
        });
        setIsOpen(false);
    };

    return (
        <div style={{ position: "relative" }} ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                disabled={isPending}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    fontSize: "14px",
                    color: "#FFFFFF",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    opacity: isPending ? 0.7 : 1,
                }}
                aria-label="Select language"
            >
                <img
                    src={current.flagUrl}
                    alt={current.label}
                    style={{ width: "20px", height: "15px", borderRadius: "2px", objectFit: "cover" }}
                />
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ opacity: 0.6 }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        marginTop: "8px",
                        width: "160px",
                        background: "rgba(17, 24, 39, 0.98)",
                        backdropFilter: "blur(12px)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.4)",
                        overflow: "hidden",
                        zIndex: 60,
                        padding: "4px 0",
                    }}
                >
                    {locales.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => handleLocaleChange(l.code)}
                            style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 14px",
                                fontSize: "14px",
                                color: locale === l.code ? "#FFFFFF" : "#9CA3AF",
                                background: locale === l.code ? "rgba(139, 92, 246, 0.2)" : "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                                if (locale !== l.code) {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (locale !== l.code) {
                                    e.currentTarget.style.background = "transparent";
                                }
                            }}
                        >
                            <img
                                src={l.flagUrl}
                                alt={l.label}
                                style={{ width: "22px", height: "16px", borderRadius: "2px", objectFit: "cover" }}
                            />
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
