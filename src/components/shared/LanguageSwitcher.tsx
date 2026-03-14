"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition, useState, useRef, useEffect } from "react";
import { trackLanguageSwitch } from "@/lib/analytics/events";

const locales = [
    { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", label: "English", flag: "🇺🇸" },
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
                disabled={isPending}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    fontSize: "14px",
                    color: "#FFFFFF",
                    background: "linear-gradient(to right, rgba(139,92,246,0.25), rgba(6,182,212,0.25))",
                    border: "1px solid rgba(139,92,246,0.4)",
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontWeight: 600,
                    letterSpacing: "0.025em",
                    opacity: isPending ? 0.7 : 1,
                }}
                aria-label="Switch language"
            >
                <span style={{ fontSize: "16px" }}>{current.flag}</span>
                <span>{current.code.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        right: 0,
                        marginTop: "8px",
                        width: "160px",
                        background: "#1F2937",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
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
                                padding: "10px 16px",
                                fontSize: "14px",
                                color: locale === l.code ? "#FFFFFF" : "#9CA3AF",
                                background: locale === l.code ? "rgba(255,255,255,0.1)" : "transparent",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                transition: "all 0.15s",
                            }}
                        >
                            <span>{l.flag}</span>
                            <span>{l.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
