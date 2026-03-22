"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowUpRight,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Globe,
  Shield,
  HeadphonesIcon,
} from "lucide-react";
import { LogoInline } from "@/components/shared/InfinityLogo";

export interface FooterService {
  slug: string;
  title: string;
}

export interface FooterData {
  services?: FooterService[];
  settings?: Record<string, string>;
}

const companyLinks = [
  { key: "about", path: "/about" },
  { key: "team", path: "/team-list" },
  { key: "contact", path: "/contact" },
];

const defaultSocialLinks = [
  { icon: Github, key: "github_url", href: "https://github.com", label: "GitHub" },
  { icon: Twitter, key: "twitter_url", href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, key: "linkedin_url", href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, key: "instagram_url", href: "https://instagram.com", label: "Instagram" },
];

export default function Footer({ data }: { data?: FooterData }) {
  const pathname = usePathname();
  const t = useTranslations("Footer");
  const nav = useTranslations("Navigation");

  const settings = data?.settings ?? {};
  const services = data?.services;

  const email = settings.contact_email || "hello@loop.vn";
  const phone = settings.contact_phone || "+84 888 123 456";
  const address = settings.contact_address || "Ho Chi Minh City, Vietnam";

  const socialLinks = defaultSocialLinks
    .map((s) => ({
      ...s,
      href: settings[s.key] || s.href,
    }))
    .filter((s) => s.href);

  return (
    <footer className="relative bg-[#030712]">
      {/* CTA Section */}
      <div className="relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/5 to-cyan-600/10" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                {t("ctaTitle")}
              </h3>
              <p className="text-gray-400 text-lg max-w-lg">
                {t("ctaDesc")}
              </p>
            </div>
            <Link
              href="/contact"
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold text-base hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              <span>{t("getInTouch")}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Highlights Bar */}
      <div className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Globe, text: t("highlightGlobal") },
              { icon: Shield, text: t("highlightQuality") },
              { icon: HeadphonesIcon, text: t("highlightSupport") },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <span className="text-sm text-gray-300 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          {/* Top: Brand + Navigation Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <div className="mb-4">
                <LogoInline size="md" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                {t("description")}
              </p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-indigo-500" />
                {t("services")}
              </h4>
              <ul className="space-y-2.5">
                {(services ?? []).map((svc) => (
                  <li key={svc.slug}>
                    <Link
                      href={`/services#${svc.slug}`}
                      className="group flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      <span>{svc.title}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-indigo-500" />
                {t("company")}
              </h4>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      href={link.path}
                      className={`group flex items-center gap-1.5 text-sm transition-colors duration-200 ${pathname === link.path
                          ? "text-indigo-400 font-medium"
                          : "text-gray-400 hover:text-white"
                        }`}
                    >
                      <span>{nav(link.key as any)}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-indigo-500" />
                {t("contact")}
              </h4>
              <div className="space-y-3">
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors flex-shrink-0">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="truncate">{email}</span>
                </a>
                <a
                  href={`tel:${phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-2.5 text-sm text-gray-400 hover:text-white transition-colors group"
                >
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-indigo-500/10 transition-colors flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span>{phone}</span>
                </a>
                <div className="flex items-center gap-2.5 text-sm text-gray-400">
                  <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span>{address}</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
                <span className="w-6 h-px bg-indigo-500" />
                {t("stayConnected")}
              </h4>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                {t("stayConnectedDesc")}
              </p>
              <div className="flex items-center gap-2.5">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-xl bg-white/5 hover:bg-indigo-500/15 border border-white/5 hover:border-indigo-500/30 flex items-center justify-center text-gray-500 hover:text-indigo-400 transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              {t("rights")}
            </p>
            <div className="flex items-center gap-8">
              <Link
                href="/privacy"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {t("privacyPolicy")}
              </Link>
              <Link
                href="/terms"
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                {t("termsOfService")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
