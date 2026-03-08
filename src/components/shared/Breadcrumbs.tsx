"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import JsonLd from "../seo/JsonLd";

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    locale?: string;
}

export function Breadcrumbs({ items, locale = "vi" }: BreadcrumbsProps) {
    // Generate JSON-LD
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.label,
            item: item.href ? `https://loop.vn${item.href}` : undefined,
        })),
    };

    return (
        <>
            <JsonLd data={jsonLd} />
            <nav aria-label="Breadcrumb" style={{ marginBottom: "24px", overflowX: "auto" }}>
                <ol style={{ display: "flex", alignItems: "center", gap: "8px", listStyle: "none", margin: 0, padding: 0, whiteSpace: "nowrap" }}>
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const isFirst = index === 0;

                        let content = (
                            <span
                                style={{
                                    color: isLast ? "#3B82F6" : "#94A3B8",
                                    fontSize: "14px",
                                    fontWeight: isLast ? 600 : 500,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "color 0.2s",
                                }}
                            >
                                {isFirst && <Home size={14} />}
                                {item.label}
                            </span>
                        );

                        if (item.href && !isLast) {
                            content = (
                                <Link href={item.href} style={{ textDecoration: "none" }}>{content}</Link>
                            );
                        }

                        return (
                            <li key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {content}
                                {!isLast && <ChevronRight size={14} color="#4B5563" />}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}
