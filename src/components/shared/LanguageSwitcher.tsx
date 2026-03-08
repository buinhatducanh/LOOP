"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useTransition, useState } from "react";
import { Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const handleLocaleChange = (newLocale: string) => {
        startTransition(() => {
            router.replace(pathname, { locale: newLocale });
            router.refresh(); // Refresh to ensure server components update properly
        });
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
            >
                <Globe size={16} />
                <span className="uppercase font-medium">{locale}</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        className="absolute right-0 mt-2 w-32 bg-gray-800 rounded-xl border border-white/10 shadow-xl overflow-hidden z-[60] py-1"
                    >
                        <button
                            onClick={() => handleLocaleChange('vi')}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${locale === 'vi' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            Tiếng Việt
                        </button>
                        <button
                            onClick={() => handleLocaleChange('en')}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${locale === 'en' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            English
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
