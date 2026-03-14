"use client";

import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  Zap,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Github,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";

const serviceLinks = [
  { key: "serviceWeb", path: "/services#web-development" },
  { key: "serviceMobile", path: "/services#mobile-apps" },
  { key: "serviceDesign", path: "/services#ui-ux-design" },
  { key: "serviceCloud", path: "/services#cloud-solutions" },
  { key: "serviceAI", path: "/services#ai-ml" },
  { key: "serviceDevops", path: "/services#devops" },
];

const companyLinks = [
  { key: "about", path: "/about" },
  { key: "portfolio", path: "/portfolio" },
  { key: "pricing", path: "/pricing" },
  { key: "contact", path: "/contact" },
];

const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
];

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations("Footer");
  const nav = useTranslations("Navigation");

  return (
    <footer className="relative bg-gray-950 border-t border-white/5">
      {/* CTA Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-600 p-8 md:p-12"
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {t('ctaTitle')}
              </h3>
              <p className="text-white/80 text-lg">
                {t('ctaDesc')}
              </p>
            </div>
            <Link
              href="/contact"
              className="flex items-center space-x-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg shadow-black/20 group whitespace-nowrap"
            >
              <span>{t('getInTouch')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 group mb-6">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                LOOP
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {t('description')}
            </p>
            <div className="space-y-3">
              <a
                href="mailto:hello@loop.vn"
                className="flex items-center space-x-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Mail className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                <span>hello@loop.vn</span>
              </a>
              <a
                href="tel:+84888123456"
                className="flex items-center space-x-3 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <Phone className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                <span>+84 888 123 456</span>
              </a>
              <div className="flex items-center space-x-3 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span>Ho Chi Minh City, Vietnam</span>
              </div>
            </div>
          </div>

          {/* Services Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">
              {t('services')}
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-200 hover:translate-x-1 inline-block"
                  >
                    {t(link.key as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">
              {t('company')}
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={link.path}
                    className={`text-sm transition-colors duration-200 hover:translate-x-1 inline-block ${pathname === link.path
                        ? "text-purple-400"
                        : "text-gray-400 hover:text-white"
                      }`}
                  >
                    {nav(link.key as any)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter / Social */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-6">
              {t('stayConnected')}
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              {t('stayConnectedDesc')}
            </p>
            <div className="flex items-center space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            {t('rights')}
          </p>
          <div className="flex items-center space-x-6">
            <Link
              href="/privacy"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t('privacyPolicy')}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
