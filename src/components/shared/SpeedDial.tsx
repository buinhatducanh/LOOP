"use client";

import { useState, useEffect } from "react";
import { usePathname } from "@/i18n/routing";
import { Phone, MessageCircle, MessageSquareText, Plus } from "lucide-react";

const ADMIN_PREFIXES = ["/admin"];

function isAdminRoute(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Speed dial contact buttons — only shown to public visitors.
 * Hidden on admin routes.
 */
export function SpeedDial() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      setMounted(true);
      if (isAdminRoute(pathname)) {
        setIsOpen(false);
      }
    }, [pathname]);

    // Don't render on admin pages or during SSR
    if (!mounted || isAdminRoute(pathname)) return null;

    const toggleOpen = () => setIsOpen(!isOpen);

    const actions = [
        {
            icon: <Phone className="h-5 w-5" />,
            name: "Hotline",
            href: "tel:+84123456789",
            color: "bg-green-500",
            hoverColor: "hover:bg-green-600",
        },
        {
            icon: <MessageCircle className="h-5 w-5" />,
            name: "Zalo",
            href: "https://zalo.me/0123456789",
            color: "bg-blue-500",
            hoverColor: "hover:bg-blue-600",
        },
        {
            icon: <MessageSquareText className="h-5 w-5" />,
            name: "Messenger",
            href: "https://m.me/loop.vn",
            color: "bg-blue-600",
            hoverColor: "hover:bg-blue-700",
        },
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <div className={`flex flex-col items-center gap-3 mb-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <a
                        key={action.name}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 hover:scale-110 animate-scale-in ${action.color} ${action.hoverColor}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                        title={action.name}
                    >
                        {action.icon}
                    </a>
                ))}
            </div>

            <button
                className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl focus:outline-none hover:bg-blue-700 transition-colors z-50"
                onClick={toggleOpen}
                aria-label="Contact options"
            >
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <Plus className="h-6 w-6" />
                </div>
            </button>
        </div>
    );
}
