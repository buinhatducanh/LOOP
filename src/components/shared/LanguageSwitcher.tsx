"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition, useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                aria-label="Switch language"
            >
                <Globe size={16} />
                <span className="font-medium">{current.flag} {current.code.toUpperCase()}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-xl border border-white/10 shadow-xl overflow-hidden z-[60] py-1"
                    >
                        {locales.map((l) => (
                            <button
                                key={l.code}
                                onClick={() => handleLocaleChange(l.code)}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${locale === l.code ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            >
                                <span>{l.flag}</span>
                                <span>{l.label}</span>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
