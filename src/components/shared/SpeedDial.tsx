"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Phone, MessageCircle, MessageSquareText, Plus } from "lucide-react";

export function SpeedDial() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const actions = [
        {
            icon: <Phone className="h-5 w-5" />,
            name: "Hotline",
            href: "tel:+84123456789", // You can update these with actual LOOP data
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
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-3 mb-4"
                    >
                        {actions.map((action, index) => (
                            <motion.a
                                key={action.name}
                                href={action.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-110 ${action.color} ${action.hoverColor}`}
                                title={action.name}
                            >
                                {action.icon}
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl focus:outline-none hover:bg-blue-700 transition-colors z-50"
                onClick={toggleOpen}
                aria-label="Contact options"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Plus className="h-6 w-6" />
                </motion.div>
            </button>
        </div>
    );
}
